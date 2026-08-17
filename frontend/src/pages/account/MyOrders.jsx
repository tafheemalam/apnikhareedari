import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as orderService from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';

export default function MyOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders({ page })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && !result) return <LoadingSpinner />;

  if (!result?.data.length) {
    return (
      <EmptyState
        title="No orders yet"
        message="Your placed orders will show up here."
        action={<Button as={Link} to="/shop">Start Shopping</Button>}
      />
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {result.data.map((order) => (
          <Link
            key={order.id}
            to={`/account/orders/${order.order_number}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{order.order_number}</p>
                <p className="text-xs text-slate-500">{formatDate(order.placed_at)} · {order.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{order.status}</Badge>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Pagination meta={result} onPageChange={(p) => setSearchParams({ page: p })} />
    </div>
  );
}
