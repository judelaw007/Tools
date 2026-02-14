'use client';

/**
 * Global error boundary for the application.
 * Catches unhandled errors and shows a user-friendly message
 * without leaking stack traces or internal details.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-600 mb-6">
            An unexpected error occurred. Please try again or contact support if the
            problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mb-4">
              Error reference: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
