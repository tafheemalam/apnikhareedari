import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import * as orderService from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Checkout hands the freshly-placed order over via navigation state, since a
  // guest checkout has no auth token to re-fetch it with GET /orders/{number}.
  const orderFromState = location.state?.order;
  const [order, setOrder] = useState(orderFromState ?? null);
  const [loading, setLoading] = useState(!orderFromState);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (orderFromState) return;

    if (!isAuthenticated) {
      // No state and no session to re-authenticate a guest lookup with.
      setLoading(false);
      setNotFound(true);
      return;
    }

    orderService
      .getOrder(orderNumber)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">We couldn't find that order.</p>
        <Button as={Link} to="/" className="mt-4">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <div className="text-5xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Thank you for your order!</h1>
      <p className="mt-2 text-slate-600">
        Your order <strong>{order.order_number}</strong> has been placed successfully.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Order Status</span>
          <Badge>{order.status}</Badge>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-slate-500">Payment</span>
          <span className="text-sm font-medium text-slate-700">
            {order.payment_method.toUpperCase()} · <Badge>{order.payment_status}</Badge>
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-base font-bold text-slate-900">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button as={Link} to="/shop" variant="secondary">Continue Shopping</Button>
        {isAuthenticated && <Button as={Link} to={`/account/orders/${order.order_number}`}>View Order</Button>}
      </div>
    </div>
  );
}
