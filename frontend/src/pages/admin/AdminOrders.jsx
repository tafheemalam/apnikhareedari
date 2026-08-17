import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as orderService from '../../services/admin/orderService';
import { formatCurrency, formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  function load() {
    setLoading(true);
    orderService
      .getOrders({ page, search: search || undefined, status: status || undefined, per_page: 15 })
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, status]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const orders = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearch}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, name, phone..."
              className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </form>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-emerald-700 hover:underline">{o.order_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.customer?.name || o.shipping.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(o.placed_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{o.payment_method.toUpperCase()}</span> <Badge>{o.payment_status}</Badge>
                  </td>
                  <td className="px-4 py-3"><Badge>{o.status}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />
    </div>
  );
}
