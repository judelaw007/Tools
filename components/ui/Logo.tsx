import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', subtext: 'text-[8px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', subtext: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', subtext: 'text-xs' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* MojiTax Eagle Logo */}
      <div className={cn('relative', sizes[size].icon)}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Eagle silhouette - stylized based on MojiTax branding */}
          <g className="fill-mojitax-navy">
            {/* Eagle body and wings */}
            <path d="M50 15c-2 0-4 1-5 3l-8 12c-1 2-3 3-5 3h-7c-3 0-5 2-5 5v2c0 2 1 4 3 5l12 8c2 1 3 3 3 5v7c0 2-1 4-2 5l-8 10c-1 2-1 4 0 5 1 2 3 3 5 2l15-8c2-1 4-1 6 0l15 8c2 1 4 0 5-2 1-1 1-3 0-5l-8-10c-1-1-2-3-2-5v-7c0-2 1-4 3-5l12-8c2-1 3-3 3-5v-2c0-3-2-5-5-5h-7c-2 0-4-1-5-3l-8-12c-1-2-3-3-5-3z" />
            {/* Eagle head */}
            <circle cx="50" cy="28" r="8" />
            {/* Beak */}
            <path d="M50 32l-3 6h6l-3-6z" className="fill-mojitax-blue" />
          </g>
          {/* Accent - eye */}
          <circle cx="50" cy="26" r="2" className="fill-white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold text-mojitax-navy tracking-tight', sizes[size].text)}>
            Moji<span className="text-mojitax-blue">Tax</span>
          </span>
          <span className={cn('text-mojitax-blue-light font-medium tracking-wider uppercase', sizes[size].subtext)}>
            Tools
          </span>
        </div>
      )}
    </div>
  );
}
