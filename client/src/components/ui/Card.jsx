import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-xl shadow-xs transition-all duration-200',
        hover && 'hover:shadow-md hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-5 border-b border-slate-100 flex flex-col space-y-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs text-slate-500 font-normal leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
