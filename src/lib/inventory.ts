import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

type PaidStockDecrementSource = 'payfast_webhook' | 'yoco_webhook' | 'sandbox_confirmation';

type ApplyPaidOrderStockDecrementArgs = {
  supabase: SupabaseClient;
  orderId: string;
  source: PaidStockDecrementSource;
};

type ApplyPaidOrderStockDecrementResult = {
  updatedProductCount: number;
  clampedProductCount: number;
  skippedItemCount: number;
  missingProductCount: number;
};

export async function applyPaidOrderStockDecrement({
  supabase,
  orderId,
  source,
}: ApplyPaidOrderStockDecrementArgs): Promise<ApplyPaidOrderStockDecrementResult> {
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id, product_id, product_name, quantity')
    .eq('order_id', orderId);

  if (orderItemsError) {
    throw new Error(
      `[Inventory] Could not fetch order items for stock decrement (${source}): ${orderItemsError.message}`
    );
  }

  const quantityByProductId = new Map<string, number>();
  let skippedItemCount = 0;

  for (const item of orderItems ?? []) {
    if (!item.product_id) {
      skippedItemCount += 1;
      console.warn('[Inventory] Skipping stock decrement for order item without product id.', {
        source,
        orderId,
        orderItemId: item.id,
        productName: item.product_name,
      });
      continue;
    }

    const quantity = Math.max(0, Math.round(item.quantity ?? 0));
    if (quantity <= 0) {
      skippedItemCount += 1;
      continue;
    }

    quantityByProductId.set(item.product_id, (quantityByProductId.get(item.product_id) ?? 0) + quantity);
  }

  if (quantityByProductId.size === 0) {
    return {
      updatedProductCount: 0,
      clampedProductCount: 0,
      skippedItemCount,
      missingProductCount: 0,
    };
  }

  const productIds = Array.from(quantityByProductId.keys());
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, stock')
    .in('id', productIds);

  if (productsError) {
    throw new Error(
      `[Inventory] Could not fetch products for stock decrement (${source}): ${productsError.message}`
    );
  }

  const stockByProductId = new Map((products ?? []).map((product) => [product.id, product.stock]));
  let updatedProductCount = 0;
  let clampedProductCount = 0;
  let missingProductCount = 0;

  for (const [productId, orderedQuantity] of quantityByProductId.entries()) {
    const currentStock = stockByProductId.get(productId);
    if (typeof currentStock !== 'number') {
      missingProductCount += 1;
      console.warn('[Inventory] Product missing during stock decrement.', {
        source,
        orderId,
        productId,
        orderedQuantity,
      });
      continue;
    }

    const nextStock = Math.max(0, currentStock - orderedQuantity);
    const wasClamped = orderedQuantity > currentStock;

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock: nextStock,
        in_stock: nextStock > 0,
      })
      .eq('id', productId);

    if (updateError) {
      throw new Error(
        `[Inventory] Could not update stock for product ${productId} (${source}): ${updateError.message}`
      );
    }

    if (wasClamped) {
      clampedProductCount += 1;
    }

    updatedProductCount += 1;

    console.info('[Inventory] Applied stock decrement for paid order.', {
      source,
      orderId,
      productId,
      orderedQuantity,
      currentStock,
      nextStock,
      wasClamped,
    });
  }

  return {
    updatedProductCount,
    clampedProductCount,
    skippedItemCount,
    missingProductCount,
  };
}
