import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true, permission: 'view-dashboard' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️', permission: 'manage-categories' },
  { to: '/admin/products', label: 'Products', icon: '📦', permission: 'manage-products' },
  { to: '/admin/inventory', label: 'Inventory', icon: '📈', permission: 'manage-inventory' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾', permission: 'manage-orders' },
  { to: '/admin/coupons', label: 'Coupons', icon: '🏷️', permission: 'manage-coupons' },
  { to: '/admin/reviews', label: 'Reviews', icon: '⭐', permission: 'manage-reviews' },
  { to: '/admin/shipping', label: 'Shipping', icon: '🚚', permission: 'manage-settings' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️', permission: 'manage-settings' },
  { to: '/admin/users', label: 'Admin Users', icon: '👤', permission: 'manage-admins' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const permissions = user?.permissions ?? [];
  const visibleItems = NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-slate-200 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/admin" className="text-lg font-bold text-white">ApniKhareedari</Link>
          <button className="text-slate-400 lg:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <Link to="/" className="block text-xs text-slate-400 hover:text-slate-200">← Back to storefront</Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1 className="text-sm font-semibold text-slate-500">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">{user?.name}</span>
            <button onClick={() => logout()} className="text-sm font-medium text-red-600 hover:text-red-700">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
