import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

/**
 * AUTH BYPASS – FRONTEND ONLY
 * Alles wordt doorgelaten.
 * Geen redirects.
 * Geen roles.
 * Geen login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  if (import.meta.env.DEV) {
    console.log('=== PROTECTED ROUTE BYPASS ===');
    console.log('Current path:', location.pathname);
    console.log('Auth disabled: TRUE');
  }

  return <>{children}</>;
}
