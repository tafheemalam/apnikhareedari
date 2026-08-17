import { Link, Outlet } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';

export default function AuthLayout() {
  const { settings } = useSite();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-2xl font-extrabold text-emerald-700">
          {settings['store.name'] || 'ApniKhareedari'}
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
