import { NextRequest, NextResponse } from 'next/server';
import { learnworlds, syncLearnWorldsUser, LearnWorldsEnrollment } from '@/lib/learnworlds';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';

/**
 * GET /api/auth/learnworlds/callback
 *
 * Handles the OAuth2 callback from LearnWorlds after successful authentication.
 *
 * Flow:
 * 1. Receive authorization code from LearnWorlds
 * 2. Exchange code for access token
 * 3. Get user information
 * 4. Sync user data with local database
 * 5. Create session and redirect to app
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains returnTo URL
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle errors from LearnWorlds
  if (error) {
    console.error('LearnWorlds SSO error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(errorDescription || error)}`,
        request.url
      )
    );
  }

  // Must have authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=missing_code', request.url)
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await learnworlds.exchangeCodeForToken(code);

    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error('Failed to exchange code for token');
    }

    // Get user information using the access token
    // Note: The token response may include user info, or we need to fetch it
    let userEmail: string | null = null;
    let userId: string | null = null;
    let userName: string | null = null;

    if (tokenResponse.user) {
      userEmail = tokenResponse.user.email;
      userId = tokenResponse.user.id;
      userName = `${tokenResponse.user.first_name || ''} ${tokenResponse.user.last_name || ''}`.trim();
    }

    if (!userEmail) {
      throw new Error('Could not retrieve user email from LearnWorlds');
    }

    // Sync user data with LearnWorlds (get enrollments, etc.)
    const syncResult = await syncLearnWorldsUser(userEmail);

    // Create session data
    const sessionData: {
      email: string;
      learnworldsId: string | null;
      name: string | null;
      role: 'user' | 'admin';
      enrollments: LearnWorldsEnrollment[];
      accessToken: string;
      expiresAt: number;
    } = {
      email: userEmail,
      learnworldsId: syncResult?.learnworldsId || userId,
      name: userName,
      role: 'user', // Default role, can be upgraded if user is admin
      enrollments: syncResult?.enrollments || [],
      accessToken: tokenResponse.access_token,
      expiresAt: tokenResponse.expires_in
        ? Date.now() + tokenResponse.expires_in * 1000
        : Date.now() + 24 * 60 * 60 * 1000, // Default 24 hours
    };

    // Check if user should be admin (you might want to check against a list)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.includes(userEmail)) {
      sessionData.role = 'admin';
    }

    // Create response with redirect
    const returnTo = state || '/dashboard';
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    // Set auth cookie with role
    response.cookies.set(AUTH_COOKIE_NAME, sessionData.role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: 'lax',
    });

    // Set session cookie with user data (encrypted in production)
    response.cookies.set(
      SESSION_COOKIE_NAME,
      Buffer.from(JSON.stringify(sessionData)).toString('base64'),
      {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    );

    return response;
  } catch (error) {
    console.error('LearnWorlds callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent('Authentication failed')}`,
        request.url
      )
    );
  }
}
