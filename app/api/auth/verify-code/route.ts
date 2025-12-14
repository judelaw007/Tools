import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';
import { verifyCode } from '@/lib/auth/verification-codes';

/**
 * POST /api/auth/verify-code
 *
 * Verifies a code and creates a session.
 *
 * Flow:
 * 1. Validate email and code
 * 2. Verify code is correct and not expired
 * 3. Fetch user data and enrollments from LearnWorlds
 * 4. Create session cookie
 * 5. Return success with redirect URL
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, returnTo = '/dashboard' } = await request.json();

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Verify the code
    const verifyResult = verifyCode(normalizedEmail, normalizedCode);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.error,
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // Code is valid - fetch user data from LearnWorlds
    const lwUser = await learnworlds.getUserByEmail(normalizedEmail);

    if (!lwUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'Your account could not be found. Please try again.',
        },
        { status: 404 }
      );
    }

    // Fetch user's course access from LearnWorlds
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
      lastEnrollmentCheck: now,
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
        courseCount: accessibleCourseIds.length,
      },
    });

    // Set session cookies (7 days expiry)
    const cookieOptions = {
      httpOnly: true,
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
    console.error('Verify code error:', error);

    // Check if it's a LearnWorlds API error
    if (error instanceof Error && error.message.includes('LearnWorlds')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'Unable to complete verification. Please try again later.',
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
