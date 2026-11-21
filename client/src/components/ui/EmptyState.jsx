import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Get started by creating your first entry or adjust your search filter.',
  actionLabel,
  onAction,
  actionIcon,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-dashed border-slate-200 rounded-xl',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            leftIcon={actionIcon || <Plus className="w-4 h-4" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
