import { Link, Outlet } from 'react-router-dom';
import logoWithSlogan from '../../assets/logo-with-slogan.png';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center">
          <img src={logoWithSlogan} alt="ApniKhareedari" className="h-14 w-auto" />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
