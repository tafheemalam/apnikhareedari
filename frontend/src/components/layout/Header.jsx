import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSite } from '../../context/SiteContext';
import SearchBar from './SearchBar';
import logoIcon from '../../assets/logo-icon.png';

export default function Header() {
  const { categories } = useSite();
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

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoIcon} alt="" className="h-9 w-auto" />
          <span className="text-xl font-extrabold">
            <span className="text-orange-600">Apni</span>
            <span className="text-teal-700">Khareedari</span>
          </span>
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
          <NavLink
            to="/shop"
            className={({ isActive }) => `flex items-center py-2 ${isActive ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
          >
            Shop
          </NavLink>
          <NavLink
            to="/baskets"
            className={({ isActive }) => `flex items-center gap-1 py-2 ${isActive ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
          >
            🧺 Baskets
          </NavLink>
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <NavLink
                to={`/categories/${cat.slug}`}
                className={({ isActive }) => `flex items-center gap-1 py-2 ${isActive ? 'text-emerald-700' : 'hover:text-emerald-700'}`}
              >
                {cat.name}
                {cat.children?.length > 0 && <span className="text-[10px]">▾</span>}
              </NavLink>
              {cat.children?.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-48 rounded-lg border border-slate-200 bg-white py-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/categories/${child.slug}`}
                      className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-100 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <Link to="/shop" onClick={() => setMobileOpen(false)}>Shop</Link>
            <Link to="/baskets" onClick={() => setMobileOpen(false)}>🧺 Baskets</Link>
            {categories.map((cat) => (
              <div key={cat.id}>
                <Link to={`/categories/${cat.slug}`} onClick={() => setMobileOpen(false)}>
                  {cat.name}
                </Link>
                {cat.children?.length > 0 && (
                  <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 text-slate-500">
                    {cat.children.map((child) => (
                      <Link key={child.id} to={`/categories/${child.slug}`} onClick={() => setMobileOpen(false)}>
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
