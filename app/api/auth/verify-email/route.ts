import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * POST /api/auth/verify-email
 *
 * Email-based authentication endpoint for LearnWorlds integration.
 *
 * Flow:
 * 1. Receive email from auth page
 * 2. Verify user exists in LearnWorlds
 * 3. Fetch their course enrollments
 * 4. Create session cookie with user data
 * 5. Return success with redirect URL
 *
 * This enables the "Access Tools" button flow from LearnWorlds courses.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, returnTo = '/dashboard' } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists in LearnWorlds
    const lwUser = await learnworlds.getUserByEmail(normalizedEmail);

    if (!lwUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'This email is not registered with MojiTax. Please sign up at mojitax.co.uk first.',
        },
        { status: 404 }
      );
    }

    // Fetch user's COURSE ACCESS from LearnWorlds
    // This returns all courses the user can access (via direct purchase, bundle, or subscription)
    const accessibleCourseIds = await learnworlds.getUserCourseAccess(lwUser.id);

    // Also fetch enrollments for display purposes
    const enrollments = await learnworlds.getUserEnrollments(lwUser.id);

    // Create session data
    const now = new Date().toISOString();
    const sessionData = {
      email: normalizedEmail,
      role: 'user' as const,
      learnworldsId: lwUser.id,
      learnworldsUser: {
        id: lwUser.id,
        email: lwUser.email,
        username: lwUser.username,
      },
      // KEY: Store accessible course IDs for tool access control
      accessibleCourseIds,
      // Also store enrollments for display
      enrollments: enrollments.map((e) => ({
        product_id: e.product_id,
        product_name: e.product_title || 'Unknown',
        product_type: e.product_type || 'course',
        enrolled_date: e.enrolled_at,
      })),
      authenticatedAt: now,
      lastEnrollmentCheck: now, // Set initial check time to prevent immediate refresh
    };

    // Encode session data
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      redirectTo: returnTo,
      user: {
        email: normalizedEmail,
        enrollmentCount: enrollments.length,
      },
    });

    // Set session cookie (7 days expiry)
    // httpOnly: false so client-side auth context can read the session
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    // Set auth role cookie (readable by middleware)
    response.cookies.set('mojitax-auth', 'user', cookieOptions);

    // Set full session cookie (with all LearnWorlds data)
    response.cookies.set('mojitax-session', encodedSession, cookieOptions);

    return response;
  } catch (error) {
    console.error('Email verification error:', error);

    // Check if it's a LearnWorlds API error
    if (error instanceof Error && error.message.includes('LearnWorlds')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'Unable to verify your account. Please try again later.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
