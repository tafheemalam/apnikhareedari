import { useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Only guard against landing here already logged in. Once rendered, a
  // login/register submission on this page flips isAuthenticated to true —
  // that transition is handled by the form's own post-login navigate(), so
  // this guard must not react to it and race against that navigation.
  const wasAuthenticatedOnEntry = useRef(null);
  if (!loading && wasAuthenticatedOnEntry.current === null) {
    wasAuthenticatedOnEntry.current = isAuthenticated;
  }

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (wasAuthenticatedOnEntry.current) return <Navigate to="/" replace />;

  return <Outlet />;
}
