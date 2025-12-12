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

    // Check if SSO is enabled (requires NEXT_PUBLIC_APP_URL for callback)
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        {
          error: 'SSO not configured - NEXT_PUBLIC_APP_URL required',
          message: 'SSO requires callback URL configuration',
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
 * If SSO not configured, shows helpful error
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Check if LearnWorlds is configured
  const configStatus = learnworlds.getConfigStatus();

  // Check if SSO callback URL is configured
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configStatus.configured || !callbackUrl) {
    // SSO not ready - redirect back to login with message
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', returnTo);
    loginUrl.searchParams.set('sso_error', 'not_configured');
    return NextResponse.redirect(loginUrl);
  }

  // Generate and redirect to the SSO login URL
  const loginUrl = learnworlds.generateSSOLoginUrl(returnTo);

  return NextResponse.redirect(loginUrl);
}
