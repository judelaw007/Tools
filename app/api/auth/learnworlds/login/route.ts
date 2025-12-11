import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * POST /api/auth/learnworlds/login
 *
 * Initiates the LearnWorlds SSO login flow.
 * Redirects the user to LearnWorlds for authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const { returnTo } = await request.json().catch(() => ({}));

    // Check if LearnWorlds is configured
    const configStatus = learnworlds.getConfigStatus();
    if (!configStatus.configured) {
      return NextResponse.json(
        {
          error: 'LearnWorlds integration not configured',
          missing: configStatus.missing,
        },
        { status: 500 }
      );
    }

    // Generate the SSO login URL
    const loginUrl = learnworlds.generateSSOLoginUrl(returnTo || '/dashboard');

    return NextResponse.json({
      success: true,
      loginUrl,
    });
  } catch (error) {
    console.error('LearnWorlds login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/learnworlds/login
 *
 * Direct redirect to LearnWorlds login
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Check if LearnWorlds is configured
  const configStatus = learnworlds.getConfigStatus();
  if (!configStatus.configured) {
    // Fallback to dev auth if LearnWorlds not configured
    return NextResponse.redirect(
      new URL(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, request.url)
    );
  }

  // Generate and redirect to the SSO login URL
  const loginUrl = learnworlds.generateSSOLoginUrl(returnTo);

  return NextResponse.redirect(loginUrl);
}
