import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Mark - Stylized "M" with tax document motif */}
      <div className={cn('relative', sizes[size].icon)}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle cx="20" cy="20" r="20" className="fill-mojitax-navy" />
          {/* Stylized "M" */}
          <path
            d="M10 28V12L16 20L20 14L24 20L30 12V28"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Accent dot */}
          <circle cx="32" cy="10" r="4" className="fill-mojitax-green" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold text-mojitax-navy tracking-tight', sizes[size].text)}>
            Moji<span className="text-mojitax-green">Tax</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
            Demo Tools
          </span>
        </div>
      )}
    </div>
  );
}
