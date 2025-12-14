import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'mojitax-session';
const STUDENT_VIEW_COOKIE = 'mojitax-student-view';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Delete the session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  // Also clear student view cookie if present
  response.cookies.set(STUDENT_VIEW_COOKIE, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
