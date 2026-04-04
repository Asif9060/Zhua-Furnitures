'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useCartStore } from '@/store';
import { formatPrice, deliveryProvinces } from '@/lib/data';
import { Check, ChevronRight, CreditCard, Truck, FileText } from 'lucide-react';
import styles from './page.module.css';

const steps = ['Delivery', 'Payment', 'Review'];

type DeliveryForm = { name: string; email: string; phone: string; address: string; city: string; province: string; postalCode: string; deliveryType: string; };

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [deliveryData, setDeliveryData] = useState<DeliveryForm | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { items, total, clearCart } = useCartStore();
  const { register, handleSubmit, watch } = useForm<DeliveryForm>();
  const selectedProvince = watch('province');
  const deliveryArea = deliveryProvinces.find(p => p.id === selectedProvince);
  const deliveryType = watch('deliveryType') || 'standard';
  const deliveryFee = deliveryArea ? (deliveryType === 'express' ? deliveryArea.expressFee : deliveryArea.standardFee) : 0;
  const cartTotal = total();
  const grandTotal = cartTotal + deliveryFee;

  const onDeliverySubmit = (data: DeliveryForm) => {
    setDeliveryData(data);
    setSubmitError('');
    setStep(1);
  };

  const placeOrder = async () => {
    if (!deliveryData) {
      setSubmitError('Please complete delivery details first.');
      setStep(0);
      return;
    }

    if (items.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    setPlacingOrder(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery: {
            ...deliveryData,
            deliveryType,
          },
          paymentMethod,
          deliveryFee,
          total: grandTotal,
          items: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            selectedFabric: item.selectedFabric,
            customNote: item.customNote,
          })),
        }),
      });

      const data = (await res.json()) as { orderNumber?: string; error?: string };
      if (!res.ok || !data.orderNumber) {
        throw new Error(data.error ?? 'Could not place order.');
      }

      clearCart();
      router.push(`/order-confirmation?order=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not place order.';
      setSubmitError(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/cart" className={styles.back}>← Back to Cart</Link>
        <h1 className={styles.title}>Checkout</h1>

        {/* Stepper */}
        <div className={styles.stepper}>
          {steps.map((s, i) => (
            <div key={s} className={styles.stepWrap}>
              <div className={styles.stepItem}>
                <div className={`${styles.stepCircle} ${i < step ? styles.done : i === step ? styles.active : styles.pending}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Left Panel */}
          <div className={styles.left}>
            {/* Step 0: Delivery */}
            {step === 0 && (
              <form onSubmit={handleSubmit(onDeliverySubmit)} className={styles.formSection}>
                <div className={styles.sectionHeader}><Truck size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Delivery Information</h2></div>
                <div className={styles.formGrid2}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" {...register('name', { required: true })} placeholder="Your full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" {...register('email', { required: true })} placeholder="your@email.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" {...register('phone', { required: true })} placeholder="+27 000 000 0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input className="form-input" {...register('address', { required: true })} placeholder="123 Main Street" />
                </div>
                <div className={styles.formGrid2}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" {...register('city', { required: true })} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <select className="form-select" {...register('province', { required: true })}>
                      <option value="">Select Province</option>
                      {deliveryProvinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input className="form-input" {...register('postalCode', { required: true })} placeholder="0000" />
                </div>

                {deliveryArea && (
                  <div className={styles.deliveryOptions}>
                    <h3 className={styles.optionsTitle}>Delivery Method</h3>
                    <div className={styles.deliveryOptGrid}>
                      {[
                        { id: 'standard', label: 'Standard Delivery', days: deliveryArea.standardDays, fee: deliveryArea.standardFee },
                        { id: 'express', label: 'Express Delivery', days: deliveryArea.expressDays, fee: deliveryArea.expressFee },
                      ].map(opt => (
                        <label key={opt.id} className={`${styles.deliveryOpt} ${deliveryType === opt.id ? styles.deliveryOptActive : ''}`}>
                          <input type="radio" value={opt.id} {...register('deliveryType')} defaultChecked={opt.id === 'standard'} className={styles.radioHidden} />
                          <div>
                            <div className={styles.optLabel}>{opt.label}</div>
                            <div className={styles.optDays}>{opt.days} business days</div>
                          </div>
                          <div className={styles.optFee}>
                            {opt.fee === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(opt.fee)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  Continue to Payment <ChevronRight size={18} />
                </button>
              </form>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}><CreditCard size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Payment Method</h2></div>
                <div className={styles.paymentMethods}>
                  {[
                    { id: 'payfast', label: 'PayFast', desc: 'Secure payment via PayFast', sub: 'Visa, Mastercard, EFT' },
                    { id: 'yoco', label: 'Yoco', desc: 'Pay with Yoco card gateway', sub: 'Instant card processing' },
                    { id: 'payflex', label: 'Payflex (BNPL)', desc: 'Buy now, pay in 4 instalments', sub: 'Interest-free · No fees' },
                  ].map(pm => (
                    <label key={pm.id} className={`${styles.paymentOpt} ${paymentMethod === pm.id ? styles.paymentOptActive : ''}`}>
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className={styles.radioHidden} />
                      <div className={styles.paymentOptLeft}>
                        <div className={styles.paymentLabel}>{pm.label}</div>
                        <div className={styles.paymentDesc}>{pm.desc}</div>
                        <div className={styles.paymentSub}>{pm.sub}</div>
                      </div>
                      {paymentMethod === pm.id && <Check size={16} color="#B59241" />}
                    </label>
                  ))}
                </div>

                {paymentMethod === 'payflex' && (
                  <div className={styles.payflex}>
                    <p className={styles.payflexTitle}>Pay {formatPrice(grandTotal / 4)} today, then 3 x {formatPrice(grandTotal / 4)} over 6 weeks</p>
                    <p className={styles.payflexNote}>Interest-free. No hidden fees. Approval is instant.</p>
                  </div>
                )}

                <div className={styles.stepBtns}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}><FileText size={18} color="#B59241" /><h2 className={styles.sectionTitle}>Review Your Order</h2></div>
                <div className={styles.reviewItems}>
                  {items.map(item => (
                    <div key={item.product.id} className={styles.reviewItem}>
                      <span className={styles.reviewName}>{item.product.name} × {item.quantity}</span>
                      <span className={styles.reviewPrice}>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.reviewTotal}>
                  <span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                </div>
                <div className={`${styles.reviewTotal} ${styles.reviewGrand}`}>
                  <span>Total</span><span>{formatPrice(grandTotal)}</span>
                </div>
                <div className={styles.stepBtns}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={placeOrder}
                    disabled={placingOrder}
                  >
                    Place Order → Pay with {paymentMethod === 'payfast' ? 'PayFast' : paymentMethod === 'yoco' ? 'Yoco' : 'Payflex'}
                  </button>
                </div>
                {submitError ? <p style={{ marginTop: '0.8rem', color: '#ffd0d0' }}>{submitError}</p> : null}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            {items.map(item => (
              <div key={item.product.id} className={styles.summaryItem}>
                <span className={styles.summaryItemName}>{item.product.name} × {item.quantity}</span>
                <span className={styles.summaryItemPrice}>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
            <div className={styles.summaryRow}><span>Delivery</span><span>{deliveryFee === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(deliveryFee)}</span></div>
            <div className={`${styles.summaryRow} ${styles.summaryGrand}`}><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
