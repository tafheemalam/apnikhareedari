import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import BasketProductCard from '../components/BasketProductCard';

export default function BasketFill() {
  const { cartBasketId } = useParams();
  const navigate = useNavigate();
  const { basketInstances, addBasketItem, removeBasketItem, loading: cartLoading } = useCart();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const cartBasket = basketInstances.find((cb) => String(cb.id) === cartBasketId);

  useEffect(() => {
    setLoadingProducts(true);
    catalogService
      .getProducts({ search: search || undefined, page, availability: 'in_stock', show_in_basket: true })
      .then(setResult)
      .finally(() => setLoadingProducts(false));
  }, [search, page]);

  async function handleAdd(product, variationId, quantity) {
    await addBasketItem(cartBasketId, { product_id: product.id, product_variation_id: variationId, quantity });
  }

  async function handleRemoveItem(itemId) {
    try {
      await removeBasketItem(cartBasketId, itemId);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (cartLoading && !cartBasket) return <LoadingSpinner className="min-h-[50vh]" />;

  if (!cartBasket) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Basket not found" message="This basket may have already been removed from your cart." />
        <div className="mt-4 text-center">
          <Link to="/baskets" className="font-semibold text-emerald-700 hover:underline">Browse baskets</Link>
        </div>
      </div>
    );
  }

  const percentFilled = Math.min(100, Math.round((cartBasket.filled_amount / cartBasket.amount) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900">🧺 {cartBasket.name}</h1>
          <span className="text-lg font-extrabold text-emerald-700">{formatCurrency(cartBasket.amount)}</span>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percentFilled}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {formatCurrency(cartBasket.filled_amount)} filled &middot; <span className="font-semibold text-emerald-700">{formatCurrency(cartBasket.remaining_amount)} remaining</span>
        </p>

        {cartBasket.items.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {cartBasket.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {item.product.name}{item.variation ? ` (${item.variation.label})` : ''} &times; {item.quantity}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{formatCurrency(item.line_total)}</span>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button variant="secondary" className="mt-4" onClick={() => navigate('/cart')}>
          Done &mdash; Go to Cart
        </Button>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Add Products</h2>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {loadingProducts && <LoadingSpinner />}
        {!loadingProducts && result?.data.length === 0 && <EmptyState title="No products found" />}
        {!loadingProducts && result?.data.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {result.data.map((product) => (
                <BasketProductCard
                  key={product.id}
                  product={product}
                  remainingAmount={cartBasket.remaining_amount}
                  onAdd={handleAdd}
                />
              ))}
            </div>
            <Pagination meta={result} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
