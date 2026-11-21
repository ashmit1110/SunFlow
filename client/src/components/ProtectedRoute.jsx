import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isAuthenticated, switchDemoRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by Role</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          This module is restricted to <strong>{allowedRoles.join(', ')}</strong> roles.
          Your current session role is <strong>{role}</strong>.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => switchDemoRole(allowedRoles[0])}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Switch to {allowedRoles[0]} Demo Role
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
