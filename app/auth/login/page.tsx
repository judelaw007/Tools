'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Loader2 } from 'lucide-react';

/**
 * Legacy Login Page - Redirects to main site
 *
 * This page exists for backwards compatibility.
 * Users should authenticate via mojitax.co.uk
 */
export default function LoginPage() {
  useEffect(() => {
    // Redirect to MojiTax main site
    window.location.href = 'https://www.mojitax.co.uk';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Logo className="h-12 mx-auto mb-6" />
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-mojitax-green" />
          <p className="text-slate-600">Redirecting to MojiTax...</p>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          Please log in at{' '}
          <a href="https://www.mojitax.co.uk" className="text-mojitax-green hover:underline">
            mojitax.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}
