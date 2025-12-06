'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-mojitax-navy text-white hover:bg-mojitax-navy-dark focus:ring-mojitax-navy',
      secondary: 'bg-slate-100 text-mojitax-navy hover:bg-slate-200 focus:ring-slate-400',
      success: 'bg-mojitax-green text-white hover:bg-mojitax-green-dark focus:ring-mojitax-green',
      ghost: 'bg-transparent text-mojitax-navy hover:bg-slate-100 focus:ring-slate-400',
      outline: 'border-2 border-mojitax-navy text-mojitax-navy hover:bg-mojitax-navy hover:text-white focus:ring-mojitax-navy bg-transparent',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
