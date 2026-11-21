import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-200/80 flex items-center justify-center text-slate-600 mb-4">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 font-mono">404</h1>
      <h2 className="text-lg font-semibold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The route you navigated to does not exist in the SunFlow operations portal.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
