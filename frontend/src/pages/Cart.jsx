import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Cart() {
  const { cart, items, subtotal, loading, updateItem, removeItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleQuantityChange(itemId, quantity) {
    if (quantity < 1) return;
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not update quantity'));
    }
  }

  async function handleRemove(itemId) {
    try {
      await removeItem(itemId);
      toast.info('Item removed from cart');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (loading && !cart) return <LoadingSpinner className="min-h-[50vh]" />;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          message="Looks like you haven't added anything yet."
          action={
            <Button as={Link} to="/shop">
              Continue Shopping
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Shopping Cart</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/products/${item.product.slug}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-700">
                      {item.product.name}
                    </Link>
                    {item.variation && <p className="text-xs text-slate-500">{item.variation.label}</p>}
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="text-xs font-medium text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_stock}
                      className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(item.line_total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Order Summary</h2>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Shipping and discounts calculated at checkout.</p>
            <Button onClick={() => navigate('/checkout')} size="lg" className="mt-4 w-full">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
