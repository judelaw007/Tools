import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'mojitax-dev-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Delete the cookie
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
