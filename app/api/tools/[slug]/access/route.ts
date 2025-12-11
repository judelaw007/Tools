import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkToolAccess } from '@/lib/learnworlds/access-control';

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';
const DEV_AUTH_COOKIE_NAME = 'mojitax-dev-auth';

interface SessionData {
  email: string;
  learnworldsId?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

/**
 * GET /api/tools/[slug]/access
 *
 * Checks if the current user has access to a specific tool.
 * Returns access status and required courses if access is denied.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();

    // Get auth cookies
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    const devAuthCookie = cookieStore.get(DEV_AUTH_COOKIE_NAME);

    // Build user profile from session
    let user: {
      id: string;
      email: string;
      role: 'user' | 'admin' | 'super_admin';
      learnworldsId?: string;
    } | null = null;

    // Try LearnWorlds session first
    if (sessionCookie?.value) {
      try {
        const session: SessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString()
        );
        user = {
          id: session.learnworldsId || session.email,
          email: session.email,
          role: session.role || 'user',
          learnworldsId: session.learnworldsId,
        };
      } catch {
        // Invalid session, continue to check other cookies
      }
    }

    // Fall back to dev auth
    if (!user) {
      const role = (authCookie?.value || devAuthCookie?.value) as
        | 'user'
        | 'admin'
        | undefined;
      if (role) {
        user = {
          id: role === 'admin' ? 'admin@mojitax.co.uk' : 'user@mojitax.co.uk',
          email:
            role === 'admin' ? 'admin@mojitax.co.uk' : 'user@mojitax.co.uk',
          role,
        };
      }
    }

    // Check access
    const accessResult = await checkToolAccess(user, slug);

    return NextResponse.json({
      success: true,
      ...accessResult,
    });
  } catch (error) {
    console.error('Error checking tool access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
