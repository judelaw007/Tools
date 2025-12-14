'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface LoginButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function LoginButton({
  className,
  variant = 'primary',
  size = 'sm',
  children = 'Log In to Access',
}: LoginButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.push('/auth')}
    >
      {children}
    </Button>
  );
}
