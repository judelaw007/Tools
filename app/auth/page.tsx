'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Loader2, AlertCircle, CheckCircle, Mail, ArrowLeft } from 'lucide-react';

/**
 * Email Verification Code Authentication Page
 *
 * Secure Flow:
 * 1. User clicks "Access Tools" button in LearnWorlds course
 * 2. URL: tools.mojitax.co.uk/auth?email={{user.email}}
 * 3. This page sends a verification code to the email
 * 4. User enters the code
 * 5. If valid, session is created and user is redirected to dashboard
 */

type AuthStep = 'email_entry' | 'sending' | 'code_entry' | 'verifying' | 'success' | 'error';

function AuthContent() {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email');
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Start with email entry if no email provided, otherwise start sending
  const [step, setStep] = useState<AuthStep>(urlEmail ? 'sending' : 'email_entry');
  const [error, setError] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [expiresIn, setExpiresIn] = useState<number>(300);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [email, setEmail] = useState<string>(urlEmail || '');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus email input when on email entry step
  useEffect(() => {
    if (step === 'email_entry') {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (step === 'code_entry' && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep('error');
            setError('Verification code expired. Please request a new code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, expiresIn]);

  // Retry countdown
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  // Send verification code on mount (only if email was in URL)
  useEffect(() => {
    async function sendCodeOnMount() {
      if (!urlEmail) {
        // No URL email - stay on email entry step
        return;
      }

      try {
        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: urlEmail }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMaskedEmail(data.maskedEmail);
          setExpiresIn(data.expiresIn || 300);
          setStep('code_entry');
          // Focus first input
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else {
          setStep('error');
          setError(data.message || data.error || 'Failed to send verification code');
          if (data.retryAfter) {
            setRetryAfter(data.retryAfter);
          }
        }
      } catch (err) {
        console.error('Send code error:', err);
        setStep('error');
        setError('Something went wrong. Please try again.');
      }
    }

    sendCodeOnMount();
  }, [urlEmail]);

  // Send code from email entry form
  async function sendCode() {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setStep('sending');
    setError('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMaskedEmail(data.maskedEmail);
        setExpiresIn(data.expiresIn || 300);
        setStep('code_entry');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setStep('email_entry');
        setError(data.message || data.error || 'Failed to send verification code');
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
      }
    } catch (err) {
      console.error('Send code error:', err);
      setStep('email_entry');
      setError('Something went wrong. Please try again.');
    }
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === 5 && newCode.every((d) => d)) {
      verifyCode(newCode.join(''));
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      verifyCode(pasted);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify code
  async function verifyCode(codeStr: string) {
    setStep('verifying');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: codeStr, returnTo, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        // Redirect after showing success
        setTimeout(() => {
          window.location.href = data.redirectTo || returnTo;
        }, 1000);
      } else {
        setStep('code_entry');
        setError(data.error || 'Invalid code');
        // Clear code inputs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setStep('code_entry');
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
    }
  }

  // Resend code
  async function resendCode() {
    if (retryAfter > 0) return;

    setError('');
    setStep('sending');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMaskedEmail(data.maskedEmail);
        setExpiresIn(data.expiresIn || 300);
        setCode(['', '', '', '', '', '']);
        setStep('code_entry');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setStep('error');
        setError(data.message || data.error || 'Failed to resend code');
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
      }
    } catch (err) {
      setStep('error');
      setError('Something went wrong. Please try again.');
    }
  }

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mojitax-bg-light to-white flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <Logo size="lg" className="justify-center mb-8" />

        <div className="bg-white rounded-xl shadow-navy border border-mojitax-bg-light p-8">
          {/* Email Entry */}
          {step === 'email_entry' && (
            <>
              <div className="w-12 h-12 bg-mojitax-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-mojitax-blue" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Access MojiTax Tools
              </h2>
              <p className="text-slate-600 mb-6">
                Enter your mojitax.co.uk email address. We&apos;ll send you a verification code.
              </p>

              <div className="space-y-4 text-left">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-mojitax-blue focus:ring-2 focus:ring-mojitax-blue/20 outline-none transition-all"
                  />
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-mojitax-blue focus:ring-mojitax-blue/20"
                  />
                  <span className="text-sm text-slate-600">
                    Remember me for 30 days
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={sendCode}
                  disabled={retryAfter > 0}
                  className="w-full py-3 px-4 bg-mojitax-blue text-white rounded-lg hover:bg-mojitax-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {retryAfter > 0 ? `Wait ${retryAfter}s` : 'Send Verification Code'}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  Don&apos;t have an account?{' '}
                  <a href="https://www.mojitax.co.uk" target="_blank" rel="noopener noreferrer" className="text-mojitax-blue hover:underline">
                    Sign up at mojitax.co.uk
                  </a>
                </p>
              </div>
            </>
          )}

          {/* Sending Code */}
          {step === 'sending' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-mojitax-blue mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Sending Verification Code
              </h2>
              <p className="text-slate-600">Please wait...</p>
              {email && (
                <p className="text-sm text-slate-500 mt-4">
                  Sending to: {email}
                </p>
              )}
            </>
          )}

          {/* Code Entry */}
          {step === 'code_entry' && (
            <>
              <div className="w-12 h-12 bg-mojitax-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-mojitax-blue" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-600 mb-6">
                We sent a verification code to<br />
                <span className="font-medium text-slate-800">{maskedEmail}</span>
              </p>

              {/* Code inputs */}
              <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-lg focus:border-mojitax-blue focus:ring-2 focus:ring-mojitax-blue/20 outline-none transition-all"
                  />
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Timer */}
              <p className="text-sm text-slate-500 mb-4">
                Code expires in{' '}
                <span className={expiresIn < 60 ? 'text-red-600 font-medium' : 'font-medium'}>
                  {formatTime(expiresIn)}
                </span>
              </p>

              {/* Resend */}
              <button
                onClick={resendCode}
                disabled={retryAfter > 0}
                className="text-sm text-mojitax-blue hover:text-mojitax-blue-dark disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {retryAfter > 0
                  ? `Resend code in ${retryAfter}s`
                  : "Didn't receive the code? Resend"}
              </button>
            </>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-mojitax-blue mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Verifying Code
              </h2>
              <p className="text-slate-600">Please wait...</p>
            </>
          )}

          {/* Success */}
          {step === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Access Verified!
              </h2>
              <p className="text-slate-600">Redirecting to your tools...</p>
            </>
          )}

          {/* Error */}
          {step === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Verification Failed
              </h2>
              <p className="text-slate-600 mb-6">{error}</p>

              {/* Retry or go back */}
              <div className="space-y-3">
                {email && retryAfter === 0 && (
                  <button
                    onClick={resendCode}
                    className="w-full py-2 px-4 bg-mojitax-blue text-white rounded-lg hover:bg-mojitax-blue-dark transition-colors"
                  >
                    Request New Code
                  </button>
                )}
                {retryAfter > 0 && (
                  <p className="text-sm text-slate-500">
                    You can request a new code in {retryAfter} seconds
                  </p>
                )}
                <button
                  onClick={() => {
                    setStep('email_entry');
                    setError('');
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Try a different email
                </button>
                <a
                  href="https://www.mojitax.co.uk"
                  className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-mojitax-navy transition-colors"
                >
                  Return to mojitax.co.uk
                </a>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-6">
          MojiTax Tools • Secure Email Verification
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-mojitax-blue" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
