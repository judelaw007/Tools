import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

/**
 * GET /api/auth/me
 *
 * Returns the current user's non-sensitive session data.
 * Used by the client-side AuthProvider since httpOnly cookies
 * can't be read via document.cookie.
 */
export async function GET() {
  const session = await getServerSession();

  if (!session?.email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.learnworldsId || session.email,
      name: session.learnworldsUser?.username || session.email.split('@')[0],
      email: session.email,
      role: session.role || 'user',
    },
  });
}
