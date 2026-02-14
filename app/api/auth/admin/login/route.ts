import { NextRequest, NextResponse } from 'next/server';
import { signInAdmin } from '@/lib/supabase/admin-auth';
import { sealSession } from '@/lib/secure-session';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per IP per 15 minutes
  const rateLimited = checkRateLimit(request, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    prefix: 'admin-login',
  });
  if (rateLimited) return rateLimited;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signInAdmin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create session data for middleware compatibility
    const sessionData = {
      email: result.session?.user.email,
      role: result.session?.admin.role || 'admin',
      authenticatedAt: new Date().toISOString(),
    };

    // Encrypt session data
    const encodedSession = await sealSession(sessionData);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        email: result.session?.user.email,
        role: result.session?.admin.role,
      },
      redirectTo: '/admin',
    });

    // Set session cookie for middleware and API authentication
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax';
      path: string;
      maxAge: number;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days for admin sessions
    };

    response.cookies.set('mojitax-session', encodedSession, cookieOptions);

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
