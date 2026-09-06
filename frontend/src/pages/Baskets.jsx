import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as basketService from '../services/basketService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function Baskets() {
  const navigate = useNavigate();
  const { startBasket } = useCart();
  const toast = useToast();
  const [baskets, setBaskets] = useState(null);
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    basketService.getActiveBaskets().then(setBaskets);
  }, []);

  async function handleFill(basket) {
    setStartingId(basket.id);
    try {
      const cart = await startBasket(basket.id);
      const newest = [...cart.basket_instances].sort((a, b) => a.id - b.id).at(-1);
      navigate(`/baskets/${newest.id}/fill`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not start this basket'));
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Fill Your Basket</h1>
      <p className="mt-2 text-sm text-slate-600">
        Pick a basket, then fill it with any products you like — pay just the basket's price, no matter what you choose,
        as long as it fits the budget.
      </p>

      {!baskets && <LoadingSpinner className="mt-8" />}
      {baskets && baskets.length === 0 && (
        <EmptyState title="No baskets available right now" message="Check back soon for basket deals." />
      )}

      {baskets && baskets.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {baskets.map((basket) => (
            <div key={basket.id} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center">
              <span className="text-3xl">🧺</span>
              <h2 className="mt-3 text-lg font-bold text-slate-900">{basket.name}</h2>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">{formatCurrency(basket.amount)}</p>
              <Button className="mt-4 w-full" loading={startingId === basket.id} onClick={() => handleFill(basket)}>
                Fill This Basket
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
