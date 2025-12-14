import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', subtext: 'text-[8px]' },
    md: { icon: 40, text: 'text-xl', subtext: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', subtext: 'text-xs' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/mojitax-logo.png"
        alt="MojiTax Logo"
        width={sizes[size].icon}
        height={sizes[size].icon}
        className="object-contain"
        priority
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold text-mojitax-navy tracking-tight', sizes[size].text)}>
            Moji<span className="text-mojitax-blue">Tax</span>
          </span>
          <span className={cn('text-mojitax-blue-light font-medium tracking-wider uppercase', sizes[size].subtext)}>
            DEMO TOOLS
          </span>
        </div>
      )}
    </div>
  );
}
