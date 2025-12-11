import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';

interface SessionData {
  email: string;
  learnworldsId?: string;
  name?: string;
  role: 'user' | 'admin' | 'super_admin';
  enrollments: Array<{
    product_id: string;
    product_title?: string;
  }>;
  accessToken?: string;
  expiresAt?: number;
}

/**
 * GET /api/auth/learnworlds/session
 *
 * Returns the current user session if authenticated.
 * Used by the client to check authentication status.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

    // Check for LearnWorlds session
    if (sessionCookie?.value) {
      try {
        const sessionData: SessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString()
        );

        // Check if session is expired
        if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
          return NextResponse.json({
            authenticated: false,
            reason: 'session_expired',
          });
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            email: sessionData.email,
            name: sessionData.name,
            role: sessionData.role,
            learnworldsId: sessionData.learnworldsId,
          },
          enrollments: sessionData.enrollments.map((e) => ({
            productId: e.product_id,
            productTitle: e.product_title,
          })),
        });
      } catch (parseError) {
        console.error('Failed to parse session:', parseError);
      }
    }

    // Check for dev auth cookie (backward compatibility)
    if (authCookie?.value) {
      const role = authCookie.value as 'user' | 'admin';

      // Dev mode users
      const devUsers = {
        user: {
          email: 'user@mojitax.co.uk',
          name: 'Demo User',
        },
        admin: {
          email: 'admin@mojitax.co.uk',
          name: 'Admin User',
        },
      };

      const devUser = devUsers[role] || devUsers.user;

      return NextResponse.json({
        authenticated: true,
        user: {
          email: devUser.email,
          name: devUser.name,
          role,
        },
        enrollments: [],
        isDevMode: true,
      });
    }

    return NextResponse.json({
      authenticated: false,
      reason: 'no_session',
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/learnworlds/session
 *
 * Logs out the user by clearing session cookies.
 */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
