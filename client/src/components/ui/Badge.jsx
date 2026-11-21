import React from 'react';
import { cn } from '../../utils/cn';

// Canonical status dictionary mapping colors and labels matching PRD and Database Design
const statusStyles = {
  // Positive / Finished
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  INSTALLED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  SURVEY_APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',

  // Progress / Transition
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200/80',
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200/80',
  SURVEY_SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200/80',
  PREPARED: 'bg-amber-50 text-amber-700 border-amber-200/80',
  AWAITING_PARTS: 'bg-amber-50 text-amber-700 border-amber-200/80',

  // Operations / In-flight
  DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  QUALIFIED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200/80',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200/80',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200/80',

  // Negative / Void / Danger
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  LOST: 'bg-rose-50 text-rose-700 border-rose-200/80',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  VOID: 'bg-rose-50 text-rose-700 border-rose-200/80',
  FAULTY: 'bg-rose-50 text-rose-700 border-rose-200/80',

  // Roles
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200/80',
  SALES: 'bg-sky-50 text-sky-700 border-sky-200/80',
  WAREHOUSE: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  TECHNICIAN: 'bg-teal-50 text-teal-700 border-teal-200/80',
  SUPPORT: 'bg-amber-50 text-amber-700 border-amber-200/80',

  // Neutral / Idle
  NEW: 'bg-slate-100 text-slate-700 border-slate-200/80',
  IN_STOCK: 'bg-slate-100 text-slate-700 border-slate-200/80',
  RESERVED: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200/80',
  RETURNED: 'bg-slate-100 text-slate-700 border-slate-200/80',
};

const dotColors = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
  slate: 'bg-slate-500',
};

export function Badge({
  status,
  label,
  variant,
  showDot = true,
  className,
  size = 'md',
  ...props
}) {
  const key = (status || '').toUpperCase();
  const fallback = 'bg-slate-100 text-slate-700 border-slate-200';
  const colorClass = variant || statusStyles[key] || fallback;

  // Format status enum to readable text if label is not provided (e.g., SURVEY_APPROVED -> Survey Approved)
  const displayLabel = label || (status ? status.replace(/_/g, ' ') : '');

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase',
        sizeClasses[size] || sizeClasses.md,
        colorClass,
        className
      )}
      {...props}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export default Badge;
