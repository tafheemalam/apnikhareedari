import { Link, Outlet } from 'react-router-dom';
import logoIcon from '../../assets/logo-icon.png';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <img src={logoIcon} alt="" className="h-11 w-auto" />
          <span className="text-2xl font-extrabold">
            <span className="text-orange-600">Apni</span>
            <span className="text-teal-700">Khareedari</span>
          </span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
