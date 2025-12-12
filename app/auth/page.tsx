'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Email-based Authentication Page
 *
 * Flow:
 * 1. User clicks "Access Tools" button in LearnWorlds course
 * 2. URL: tools.mojitax.co.uk/auth?email={{user.email}}
 * 3. This page calls API to verify email with LearnWorlds
 * 4. If valid, session is created and user is redirected to dashboard
 * 5. If invalid, user is redirected back to mojitax.co.uk
 */
export default function AuthPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your access...');

  const email = searchParams.get('email');
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  useEffect(() => {
    async function verifyAndAuthenticate() {
      // No email provided - redirect to main site
      if (!email) {
        setStatus('error');
        setMessage('No email provided. Redirecting to MojiTax...');
        setTimeout(() => {
          window.location.href = 'https://www.mojitax.co.uk';
        }, 2000);
        return;
      }

      try {
        // Call our API to verify the email with LearnWorlds
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, returnTo }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Access verified! Redirecting to your tools...');

          // Small delay to show success message
          setTimeout(() => {
            window.location.href = data.redirectTo || returnTo;
          }, 1000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Redirecting to MojiTax...');

          // Redirect to main site after showing error
          setTimeout(() => {
            window.location.href = 'https://www.mojitax.co.uk';
          }, 3000);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('error');
        setMessage('Something went wrong. Redirecting to MojiTax...');

        setTimeout(() => {
          window.location.href = 'https://www.mojitax.co.uk';
        }, 3000);
      }
    }

    verifyAndAuthenticate();
  }, [email, returnTo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Logo className="h-12 mx-auto mb-8" />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-mojitax-green mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Verifying Access
              </h2>
              <p className="text-slate-600">{message}</p>
              {email && (
                <p className="text-sm text-slate-500 mt-4">
                  Checking: {email}
                </p>
              )}
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Access Verified!
              </h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Access Issue
              </h2>
              <p className="text-slate-600">{message}</p>
              <p className="text-sm text-slate-500 mt-4">
                Please ensure you're enrolled in a MojiTax course at{' '}
                <a
                  href="https://www.mojitax.co.uk"
                  className="text-mojitax-green hover:underline"
                >
                  mojitax.co.uk
                </a>
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-6">
          MojiTax Tools • Powered by LearnWorlds
        </p>
      </div>
    </div>
  );
}
