import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSite } from '../../context/SiteContext';
import SearchBar from './SearchBar';

export default function Header() {
  const { categories, settings } = useSite();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemsCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <Link to="/" className="shrink-0 text-xl font-extrabold text-emerald-700">
          {settings['store.name'] || 'ApniKhareedari'}
        </Link>

        <SearchBar className="hidden max-w-xl flex-1 md:flex" />

        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-emerald-700"
            >
              {isAuthenticated ? `Hi, ${user.name.split(' ')[0]}` : 'Account'} ▾
            </button>
            {accountOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                onMouseLeave={() => setAccountOpen(false)}
              >
                {isAuthenticated ? (
                  <>
                    <Link to="/account/orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">My Orders</Link>
                    <Link to="/account/wishlist" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Wishlist</Link>
                    <Link to="/account/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</Link>
                    <Link to="/account/addresses" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Addresses</Link>
                    {user.is_admin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-emerald-700 hover:bg-slate-50">Admin Panel</Link>
                    )}
                    <button
                      onClick={() => logout()}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Login</Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/account/wishlist" className="hidden text-lg text-slate-700 hover:text-emerald-700 sm:block" aria-label="Wishlist">
            ♡
          </Link>

          <Link to="/cart" className="relative text-lg text-slate-700 hover:text-emerald-700" aria-label="Cart">
            🛒
            {itemsCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <SearchBar className="px-4 pb-3 md:hidden" />

      <nav className="hidden border-t border-slate-100 bg-slate-50 lg:block">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-2 text-sm font-medium text-slate-600">
          <NavLink to="/shop" className={({ isActive }) => (isActive ? 'text-emerald-700' : 'hover:text-emerald-700')}>
            Shop
          </NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className={({ isActive }) => (isActive ? 'text-emerald-700' : 'hover:text-emerald-700')}
            >
              {cat.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-100 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <Link to="/shop" onClick={() => setMobileOpen(false)}>Shop</Link>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <hr className="my-2" />
            {isAuthenticated ? (
              <>
                <Link to="/account/orders" onClick={() => setMobileOpen(false)}>My Orders</Link>
                <Link to="/account/wishlist" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                <Link to="/account/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
                {user.is_admin && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                <button onClick={() => logout()} className="text-left text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
