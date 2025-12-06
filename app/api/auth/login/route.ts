import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'mojitax-dev-auth';

export async function POST(request: NextRequest) {
  try {
    const { role, returnTo } = await request.json();

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const redirectTo = role === 'admin' ? '/admin' : (returnTo || '/dashboard');

    const response = NextResponse.json({ success: true, redirectTo });

    // Set the cookie server-side
    response.cookies.set(AUTH_COOKIE_NAME, role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false, // Allow client-side reading
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
