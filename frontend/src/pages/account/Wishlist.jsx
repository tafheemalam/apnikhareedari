import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as wishlistService from '../../services/wishlistService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, extractErrorMessage } from '../../utils/format';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const { refresh: refreshCart } = useCart();
  const toast = useToast();

  function load() {
    wishlistService.getWishlist().then(setItems);
  }

  useEffect(load, []);

  async function handleRemove(productId) {
    await wishlistService.removeFromWishlist(productId);
    setItems((current) => current.filter((i) => i.product.id !== productId));
  }

  async function handleMoveToCart(productId) {
    try {
      await wishlistService.moveToCart(productId);
      setItems((current) => current.filter((i) => i.product.id !== productId));
      await refreshCart();
      toast.success('Moved to cart');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (!items) return <LoadingSpinner />;

  if (!items.length) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        message="Save items you love for later."
        action={<Button as={Link} to="/shop">Browse Products</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {item.product.image_url && <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />}
          </div>
          <div className="flex flex-1 flex-col">
            <Link to={`/products/${item.product.slug}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-700">
              {item.product.name}
            </Link>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(item.product.current_price)}</span>
            <div className="mt-auto flex gap-2 pt-2">
              <Button size="sm" onClick={() => handleMoveToCart(item.product.id)} disabled={!item.product.in_stock}>
                Move to Cart
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(item.product.id)}>Remove</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
