import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword({
        email: searchParams.get('email'),
        token: searchParams.get('token'),
        ...form,
      });
      toast.success('Password reset successfully. Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Reset link is invalid or expired'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Reset Your Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <Input
          label="Confirm New Password"
          type="password"
          required
          value={form.password_confirmation}
          onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
        />
        <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
      </form>
    </div>
  );
}
