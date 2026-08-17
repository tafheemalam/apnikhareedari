import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import * as addressService from '../services/addressService';
import * as catalogService from '../services/catalogService';
import * as orderService from '../services/orderService';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/FormField';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EMPTY_FORM = {
  shipping_full_name: '',
  shipping_phone: '',
  shipping_email: '',
  shipping_address: '',
  shipping_city: '',
  shipping_area: '',
  shipping_postal_code: '',
  delivery_notes: '',
};

export default function Checkout() {
  const { cart, items, subtotal, refresh: refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSite();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(!isAuthenticated);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    shipping_full_name: user?.name || '',
    shipping_email: user?.email || '',
    shipping_phone: user?.phone || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [shipping, setShipping] = useState({ amount: 0, zone: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      addressService.getAddresses().then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.is_default) || data[0];
        if (def) {
          setSelectedAddressId(def.id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      });
    }
  }, [isAuthenticated]);

  const city = useNewAddress ? form.shipping_city : addresses.find((a) => a.id === selectedAddressId)?.city;

  useEffect(() => {
    if (!city || !subtotal) return;
    const discountedSubtotal = coupon ? subtotal - coupon.discount_amount : subtotal;
    catalogService.estimateShipping(city, discountedSubtotal).then(setShipping).catch(() => {});
  }, [city, subtotal, coupon]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await catalogService.validateCoupon(couponCode.trim(), subtotal);
      setCoupon(data);
      toast.success(`Coupon applied: -${formatCurrency(data.discount_amount)}`);
    } catch (err) {
      setCoupon(null);
      toast.error(extractErrorMessage(err, 'Invalid coupon'));
    } finally {
      setCouponLoading(false);
    }
  }

  const discount = coupon?.discount_amount || 0;
  const tax = 0;
  const total = Math.max(0, subtotal - discount + (shipping.amount || 0) + tax);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        coupon_code: coupon?.code,
        delivery_notes: form.delivery_notes,
      };

      if (!useNewAddress && selectedAddressId) {
        payload.address_id = selectedAddressId;
      } else {
        Object.assign(payload, {
          shipping_full_name: form.shipping_full_name,
          shipping_phone: form.shipping_phone,
          shipping_email: form.shipping_email,
          shipping_address: form.shipping_address,
          shipping_city: form.shipping_city,
          shipping_area: form.shipping_area,
          shipping_postal_code: form.shipping_postal_code,
        });
      }

      const order = await orderService.checkout(payload);
      await refreshCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Checkout failed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart) return <LoadingSpinner className="min-h-[50vh]" />;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Button as={Link} to="/shop" className="mt-4">Continue Shopping</Button>
      </div>
    );
  }

  const codEnabled = settings['payment.cod_enabled'] === '1';
  const onlineEnabled = settings['payment.online_enabled'] === '1';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Delivery Address</h2>

            {isAuthenticated && addresses.length > 0 && (
              <div className="mb-4 space-y-2">
                {addresses.map((addr) => (
                  <label key={addr.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                    <input
                      type="radio"
                      name="address"
                      checked={!useNewAddress && selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setUseNewAddress(false);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <strong>{addr.full_name}</strong> — {addr.address_line}, {addr.city} {addr.postal_code}
                      <br />
                      <span className="text-slate-500">{addr.phone}</span>
                    </span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-700">
                  <input type="radio" name="address" checked={useNewAddress} onChange={() => setUseNewAddress(true)} />
                  Use a new address
                </label>
              </div>
            )}

            {useNewAddress && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Full Name" required value={form.shipping_full_name} onChange={(e) => setForm((f) => ({ ...f, shipping_full_name: e.target.value }))} />
                <Input label="Mobile Number" required value={form.shipping_phone} onChange={(e) => setForm((f) => ({ ...f, shipping_phone: e.target.value }))} />
                <Input label="Email" type="email" className="sm:col-span-2" value={form.shipping_email} onChange={(e) => setForm((f) => ({ ...f, shipping_email: e.target.value }))} />
                <Input label="Address" required className="sm:col-span-2" value={form.shipping_address} onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))} />
                <Input label="City" required value={form.shipping_city} onChange={(e) => setForm((f) => ({ ...f, shipping_city: e.target.value }))} />
                <Input label="Area" value={form.shipping_area} onChange={(e) => setForm((f) => ({ ...f, shipping_area: e.target.value }))} />
                <Input label="Postal Code" value={form.shipping_postal_code} onChange={(e) => setForm((f) => ({ ...f, shipping_postal_code: e.target.value }))} />
              </div>
            )}

            <Textarea
              label="Delivery Notes (optional)"
              className="mt-3"
              value={form.delivery_notes}
              onChange={(e) => setForm((f) => ({ ...f, delivery_notes: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Payment Method</h2>
            <div className="space-y-2">
              {codEnabled && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  Cash on Delivery
                </label>
              )}
              {onlineEnabled && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                  Online Payment
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Order Summary</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto border-b border-slate-100 pb-3 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-slate-600">
                <span className="line-clamp-1">{item.product.name} × {item.quantity}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleApplyCoupon} loading={couponLoading}>
              Apply
            </Button>
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{shipping.amount ? formatCurrency(shipping.amount) : 'Free'}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <Button type="submit" size="lg" loading={submitting} className="mt-4 w-full">
            Place Order
          </Button>
        </div>
      </form>
    </div>
  );
}
