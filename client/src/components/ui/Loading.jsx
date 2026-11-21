import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ size = 'md', className, color = 'amber' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    amber: 'text-amber-500',
    slate: 'text-slate-600',
    white: 'text-white',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin shrink-0',
        sizeClasses[size] || sizeClasses.md,
        colorClasses[color] || colorClasses.amber,
        className
      )}
    />
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse bg-slate-200/80 rounded-md', className)}
      {...props}
    />
  );
}

export function LoadingOverlay({ message = 'Loading details...', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 space-y-3 bg-white/80 backdrop-blur-xs rounded-xl min-h-[220px]',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-xs font-medium text-slate-600 tracking-wide">{message}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden p-4 space-y-3">
      <Skeleton className="h-7 w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
