import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication & Access Control Middleware
 *
 * LOCKED PLATFORM MODEL:
 * - ALL routes require authentication except login/auth routes
 * - Admin users: Full access to everything
 * - MojiTax users (via LearnWorlds SSO): Access to tools allocated to their enrolled courses
 * - No public access - must login via mojitax.co.uk or admin login
 *
 * Cookie Strategy:
 * - mojitax-auth: Contains user role ('user' | 'admin')
 * - mojitax-session: Contains full session data (LearnWorlds user info, enrollments)
 * - mojitax-dev-auth: Development mode auth (backward compatibility)
 */

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';
const DEV_AUTH_COOKIE_NAME = 'mojitax-dev-auth';

// Routes that DON'T require authentication (public access)
const publicRoutes = [
  '/auth/login',
  '/login',
  '/api/auth',
  '/api/learnworlds',
];

// Routes that require admin role ONLY
const adminOnlyRoutes = ['/admin'];

/**
 * Parse session data from cookie
 */
function parseSession(sessionCookie: string | undefined): {
  email?: string;
  role?: 'user' | 'admin' | 'super_admin';
  learnworldsId?: string;
  enrollments?: Array<{ product_id: string }>;
} | null {
  if (!sessionCookie) return null;

  try {
    return JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
  } catch {
    return null;
  }
}

/**
 * Check if user has any role (is authenticated)
 */
function isAuthenticated(
  authCookie: string | undefined,
  devAuthCookie: string | undefined,
  session: ReturnType<typeof parseSession>
): boolean {
  // Check LearnWorlds session
  if (session?.email) return true;

  // Check production auth cookie
  if (authCookie === 'user' || authCookie === 'admin') return true;

  // Check dev auth cookie (backward compatibility)
  if (devAuthCookie === 'user' || devAuthCookie === 'admin') return true;

  return false;
}

/**
 * Check if user is admin
 */
function isAdmin(
  authCookie: string | undefined,
  devAuthCookie: string | undefined,
  session: ReturnType<typeof parseSession>
): boolean {
  // Check session role
  if (session?.role === 'admin' || session?.role === 'super_admin') return true;

  // Check production auth cookie
  if (authCookie === 'admin') return true;

  // Check dev auth cookie
  if (devAuthCookie === 'admin') return true;

  return false;
}

/**
 * Check if route is public (doesn't require auth)
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========================================
  // PUBLIC ROUTES - No auth required
  // ========================================
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get all auth cookies
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const devAuthCookie = request.cookies.get(DEV_AUTH_COOKIE_NAME)?.value;

  // Parse session data
  const session = parseSession(sessionCookie);

  // Check authentication status
  const authenticated = isAuthenticated(authCookie, devAuthCookie, session);
  const admin = isAdmin(authCookie, devAuthCookie, session);

  // ========================================
  // LOCKED PLATFORM - Require authentication for ALL routes
  // ========================================
  if (!authenticated) {
    // Not authenticated - redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ========================================
  // ADMIN ROUTES - Admin only access
  // ========================================
  const isAdminRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute && !admin) {
    // Authenticated but not admin - redirect to dashboard with error
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(dashboardUrl);
  }

  // ========================================
  // AUTHENTICATED USER - Allow access
  // Tool access control happens at page/component level
  // ========================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
