
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, hasRole, isSuperAdmin } = useAuth();
  const location = useLocation();

  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('Current path:', location.pathname);
  console.log('User:', user?.email || 'No user');
  console.log('User ID:', user?.id || 'No user ID');
  console.log('Loading:', loading);
  console.log('Required role:', requiredRole);
  console.log('Has required role:', requiredRole ? hasRole(requiredRole) : 'No role required');
  console.log('Is super admin:', isSuperAdmin());

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login from:', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role-based access - Super admin can access everything
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);
    const isSuper = isSuperAdmin();
    
    console.log('Role check details:', {
      requiredRole,
      hasRequiredRole,
      isSuper,
      userRole: user?.email
    });
    
    // Super admin bypasses all role requirements
    if (!isSuper && !hasRequiredRole) {
      console.log('ProtectedRoute: Insufficient permissions for role:', requiredRole);
      return <Navigate to="/" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted to:', location.pathname);
  return <>{children}</>;
}
