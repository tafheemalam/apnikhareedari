import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.is_admin ? '/admin' : location.state?.from?.pathname || '/');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Login to your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-emerald-700 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Login</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account? <Link to="/register" className="font-semibold text-emerald-700 hover:underline">Register</Link>
      </p>
    </div>
  );
}
