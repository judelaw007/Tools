import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logActivity, extractRequestInfo } from '@/lib/activity-logs';

const SESSION_COOKIE_NAME = 'mojitax-session';
const STUDENT_VIEW_COOKIE = 'mojitax-student-view';

export async function POST(request: NextRequest) {
  // Get user info before clearing session for logging
  let userEmail: string | null = null;
  let userName: string | null = null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      const session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString()
      );
      userEmail = session.email;
      userName = session.name;
    }
  } catch {
    // Ignore parse errors
  }

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

  // Log logout activity (non-blocking)
  if (userEmail) {
    const { ipAddress, userAgent } = extractRequestInfo(request);
    logActivity({
      type: 'user_logout',
      userEmail,
      userName: userName || userEmail.split('@')[0],
      description: `${userName || userEmail} logged out`,
      ipAddress,
      userAgent,
    }).catch((err) => console.error('Failed to log logout activity:', err));
  }

  return response;
}
