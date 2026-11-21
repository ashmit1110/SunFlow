import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm focus-visible:ring-amber-500',
  secondary: 'bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm focus-visible:ring-slate-900',
  outline: 'border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-amber-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm focus-visible:ring-rose-500',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm focus-visible:ring-emerald-500',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  icon: 'p-2 rounded-lg',
};

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
