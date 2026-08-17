import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-bold text-slate-900">Check your email</h1>
        <p className="text-sm text-slate-600">We've sent a password reset link to {email}.</p>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">Back to Login</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-slate-900">Forgot Password</h1>
      <p className="mb-6 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Back to Login</Link>
      </p>
    </div>
  );
}
