import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';
import { extractErrorMessage } from '../../utils/format';

export default function VerifyEmailBanner() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isAuthenticated || user?.email_verified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await authService.resendVerificationEmail();
      setSent(true);
      toast.success('Verification email sent — check your inbox.');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not send verification email'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
      Please verify your email address before placing an order.{' '}
      <button
        onClick={handleResend}
        disabled={sending || sent}
        className="font-semibold underline underline-offset-2 disabled:no-underline disabled:opacity-60"
      >
        {sent ? 'Verification email sent' : sending ? 'Sending…' : 'Resend verification email'}
      </button>
    </div>
  );
}
