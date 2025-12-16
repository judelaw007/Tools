import { NextRequest, NextResponse } from 'next/server';
import { signInAdmin } from '@/lib/supabase/admin-auth';

export async function POST(request: NextRequest) {
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

    // Encode session data
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

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
      httpOnly: false, // Must be false for client-side auth context
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
