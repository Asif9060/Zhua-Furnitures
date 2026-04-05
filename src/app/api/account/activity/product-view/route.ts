import { NextResponse } from 'next/server';
import { getOptionalUser } from '@/lib/auth';
import { logProductView } from '@/lib/user-activity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = (await request.json()) as {
    productId?: string;
    slug?: string;
  };

  const productId = String(payload.productId ?? '').trim();
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  await logProductView({
    userId: user.id,
    productId,
    context: {
      slug: payload.slug ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
