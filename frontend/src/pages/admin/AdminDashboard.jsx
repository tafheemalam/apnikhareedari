import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import * as dashboardService from '../../services/admin/dashboardService';
import { formatCurrency, formatDate } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const PIE_COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4b5563', '#db2777'];

function StatCard({ label, value, accent = 'text-slate-900' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardService.getDashboard().then(setData);
  }, []);

  if (!data) return <LoadingSpinner className="min-h-[60vh]" />;

  const { totals, recent_orders, recent_customers, charts } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Products" value={totals.products} />
        <StatCard label="Active Products" value={totals.active_products} />
        <StatCard label="Categories" value={totals.categories} />
        <StatCard label="Total Orders" value={totals.orders} />
        <StatCard label="Pending Orders" value={totals.pending_orders} accent="text-amber-600" />
        <StatCard label="Processing" value={totals.processing_orders} accent="text-blue-600" />
        <StatCard label="Completed" value={totals.completed_orders} accent="text-emerald-600" />
        <StatCard label="Cancelled" value={totals.cancelled_orders} accent="text-red-600" />
        <StatCard label="Total Sales" value={formatCurrency(totals.total_sales)} accent="text-emerald-700" />
        <StatCard label="Today's Sales" value={formatCurrency(totals.today_sales)} accent="text-emerald-700" />
        <StatCard label="Low Stock" value={totals.low_stock_products} accent="text-amber-600" />
        <StatCard label="Out of Stock" value={totals.out_of_stock_products} accent="text-red-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Daily Sales (Last 30 Days)</h3>
          <ResponsiveContainer width="99%" height={240}>
            <LineChart data={charts.daily_sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => formatDate(d)} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(d) => formatDate(d)} />
              <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Monthly Sales (Last 12 Months)</h3>
          <ResponsiveContainer width="99%" height={240}>
            <BarChart data={charts.monthly_sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Orders by Status</h3>
          <ResponsiveContainer width="99%" height={240}>
            <PieChart>
              <Pie
                data={Object.entries(charts.orders_by_status).map(([status, count]) => ({ name: status, value: count }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
                isAnimationActive={false}
              >
                {Object.keys(charts.orders_by_status).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Top Selling Products</h3>
          <ResponsiveContainer width="99%" height={240}>
            <BarChart data={charts.top_selling_products} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="product_name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="units_sold" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Recent Orders</h3>
          <div className="divide-y divide-slate-100">
            {recent_orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2 text-sm hover:text-emerald-700">
                <span>{o.order_number} · {o.customer}</span>
                <span className="flex items-center gap-2">
                  <Badge>{o.status}</Badge>
                  <span className="font-semibold">{formatCurrency(o.total)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Recent Customers</h3>
          <div className="divide-y divide-slate-100">
            {recent_customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.name}</span>
                <span className="text-slate-500">{c.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
