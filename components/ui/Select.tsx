'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helpText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-mojitax-navy mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-mojitax-navy focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none pr-10',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:ring-mojitax-green',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        {helpText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helpText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
