import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Simple health check endpoint for monitoring.
 * Returns 200 if the server is running.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
