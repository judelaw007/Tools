import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';
import { parseSession, encodeSession, SessionData } from '@/lib/session';

/**
 * GET /api/auth/refresh-session
 *
 * Refreshes user enrollments from LearnWorlds.
 * Called automatically when session is older than 24 hours.
 *
 * Flow:
 * 1. Parse existing session
 * 2. Verify user still exists in LearnWorlds
 * 3. If user deleted → clear session, redirect to main site
 * 4. If user exists → fetch fresh enrollments, update cookie, redirect back
 */
export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/dashboard';
  const sessionCookie = request.cookies.get('mojitax-session')?.value;

  // No session - redirect to main site
  if (!sessionCookie) {
    return NextResponse.redirect('https://www.mojitax.co.uk');
  }

  // Parse session
  const session = parseSession(sessionCookie);
  if (!session) {
    // Invalid session - clear and redirect
    const response = NextResponse.redirect('https://www.mojitax.co.uk');
    response.cookies.delete('mojitax-auth');
    response.cookies.delete('mojitax-session');
    return response;
  }

  // Admin sessions don't need refresh
  if (session.role === 'admin') {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  // No LearnWorlds ID - can't refresh, just continue
  if (!session.learnworldsId) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  try {
    // Verify user still exists in LearnWorlds
    const user = await learnworlds.getUserById(session.learnworldsId);

    // User no longer exists - IMMEDIATE REVOCATION
    if (!user) {
      console.log(`Session refresh: User ${session.email} no longer exists in LearnWorlds`);

      const response = NextResponse.redirect('https://www.mojitax.co.uk');
      response.cookies.delete('mojitax-auth');
      response.cookies.delete('mojitax-session');
      return response;
    }

    // User exists - fetch fresh course access and enrollments
    const [accessibleCourseIds, enrollments] = await Promise.all([
      learnworlds.getUserCourseAccess(session.learnworldsId),
      learnworlds.getUserEnrollments(session.learnworldsId),
    ]);

    // Update session with fresh data
    const updatedSession: SessionData = {
      ...session,
      learnworldsUser: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      // KEY: Refresh accessible course IDs for tool access control
      accessibleCourseIds,
      enrollments: enrollments.map((e) => ({
        product_id: e.product_id,
        product_name: e.product_name,
        product_type: e.product_type,
        enrolled_date: e.enrolled_date,
      })),
      lastEnrollmentCheck: new Date().toISOString(),
    };

    // Create response with redirect
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    // Update session cookie
    response.cookies.set('mojitax-session', encodeSession(updatedSession), cookieOptions);

    console.log(`Session refreshed for ${session.email}: ${enrollments.length} enrollments`);

    return response;
  } catch (error) {
    console.error('Session refresh error:', error);

    // On API error, don't lock out user - just continue with existing session
    // But update the lastEnrollmentCheck to prevent constant retries
    const updatedSession: SessionData = {
      ...session,
      lastEnrollmentCheck: new Date().toISOString(),
    };

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set(
      'mojitax-session',
      encodeSession(updatedSession),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      }
    );

    return response;
  }
}
