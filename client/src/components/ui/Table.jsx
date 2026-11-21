import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className={cn('w-full text-left border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white text-slate-700', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, hover = true, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        hover && 'hover:bg-slate-50/80',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn('px-4 py-3.5 font-semibold whitespace-nowrap', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn('px-4 py-3.5 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 rounded-b-xl text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Previous
        </Button>
        <span className="px-2 font-medium">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
