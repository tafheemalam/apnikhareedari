import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';
import { extractErrorMessage } from '../../utils/format';
import {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  sanitizePhoneDigits,
  formatPhoneDisplay,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from '../../utils/validators';
import { Input, PasswordInput } from '../../components/ui/FormField';
import PasswordStrength from '../../components/ui/PasswordStrength';
import Button from '../../components/ui/Button';

function CheckYourEmail({ email, loginState }) {
  const toast = useToast();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      await authService.resendVerificationEmailForGuest(email);
      setResent(true);
      toast.success('Verification email sent.');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not resend verification email'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✉</div>
      <h1 className="text-xl font-bold text-slate-900">Check Your Email</h1>
      <p className="mt-2 text-sm text-slate-600">
        We've sent a verification link to <strong>{email}</strong>.
      </p>

      <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left text-sm text-slate-600">
        <p className="mb-2 font-semibold text-slate-800">To verify your account:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Log in to your email account.</li>
          <li>Open the email from <strong>ApniKhareedari</strong>.</li>
          <li>Click the verification link inside.</li>
        </ol>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Didn't get the email?{' '}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="font-semibold text-emerald-700 underline underline-offset-2 disabled:no-underline disabled:opacity-60"
        >
          {resent ? 'Sent' : resending ? 'Sending…' : 'Resend it'}
        </button>
      </p>

      <Button as={Link} to="/login" state={loginState} className="mt-6 w-full">Go to Login</Button>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const isCheckoutRedirect = location.state?.from?.pathname === '/checkout';

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (form.phone && !isValidPhone(form.phone)) next.phone = 'Enter a valid Pakistani mobile number, e.g. 0300 1234567.';
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
      const user = await register(form);
      setRegisteredEmail(user.email);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return <CheckYourEmail email={registeredEmail} loginState={location.state} />;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        {isCheckoutRedirect ? 'Create an account and verify your email to continue to checkout.' : ' '}
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Full Name"
          required
          error={errors.name}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Mobile Number"
          type="tel"
          placeholder="0300 1234567"
          error={errors.phone}
          value={formatPhoneDisplay(form.phone)}
          onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneDigits(e.target.value) }))}
        />
        <div>
          <PasswordInput
            label="Password"
            required
            error={errors.password}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <PasswordStrength password={form.password} />
        </div>
        <PasswordInput
          label="Confirm Password"
          required
          error={errors.password_confirmation}
          value={form.password_confirmation}
          onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
        />
        <Button type="submit" loading={loading} className="w-full">Create Account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" state={location.state} className="font-semibold text-emerald-700 hover:underline">Login</Link>
      </p>
    </div>
  );
}
