import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import * as authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/format';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function VerifyEmail() {
  const { id, hash } = useParams();
  const location = useLocation();
  const { refresh, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const hasRequested = useRef(false);

  useEffect(() => {
    // Guards against React StrictMode's dev-mode double-invoke of effects —
    // this call has a real side effect (marks the email verified) and must
    // only ever fire once per link click, not once per render cycle.
    if (hasRequested.current) return;
    hasRequested.current = true;

    authService
      .verifyEmail(id, hash, location.search)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        if (isAuthenticated) refresh();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(extractErrorMessage(err, 'This verification link is invalid or has expired.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hash, location.search]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'verifying' && (
        <>
          <LoadingSpinner />
          <p className="mt-4 text-sm text-slate-500">Verifying your email…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h1 className="text-xl font-bold text-slate-900">Email Verified</h1>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
          <Button as={Link} to={isAuthenticated ? '/' : '/login'} className="mt-6">
            {isAuthenticated ? 'Continue Shopping' : 'Login'}
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">✕</div>
          <h1 className="text-xl font-bold text-slate-900">Verification Failed</h1>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
          <Button as={Link} to="/" className="mt-6">Back to Home</Button>
        </>
      )}
    </div>
  );
}
