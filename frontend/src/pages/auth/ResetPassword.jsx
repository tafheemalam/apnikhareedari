import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../utils/validators';
import { PasswordInput } from '../../components/ui/FormField';
import PasswordStrength from '../../components/ui/PasswordStrength';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!isStrongPassword(form.password)) next.password = PASSWORD_REQUIREMENTS_MESSAGE;
    if (form.password_confirmation !== form.password) next.password_confirmation = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

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
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <PasswordInput
            label="New Password"
            required
            error={errors.password}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <PasswordStrength password={form.password} />
        </div>
        <PasswordInput
          label="Confirm New Password"
          required
          error={errors.password_confirmation}
          value={form.password_confirmation}
          onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
        />
        <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
      </form>
    </div>
  );
}
