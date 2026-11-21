import React from 'react';
import { cn } from '../utils/cn';

export function PageContainer({
  title,
  subtitle,
  actions,
  breadcrumbs,
  children,
  className,
}) {
  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto', className)}>
      {/* Page Header */}
      {(title || subtitle || actions || breadcrumbs) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="space-y-1">
            {breadcrumbs && (
              <div className="text-xs text-slate-400 font-medium">
                {breadcrumbs}
              </div>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2.5">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Main Content Body */}
      <div>{children}</div>
    </div>
  );
}

export default PageContainer;
