import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication & Access Control Middleware
 *
 * NO-DOOR PLATFORM MODEL:
 * - Users authenticate via "Access Tools" button in LearnWorlds courses
 * - URL: tools.mojitax.co.uk/auth?email={{user.email}}
 * - Email is verified against LearnWorlds API
 * - No visible login page - unauthenticated users redirect to mojitax.co.uk
 * - Admin has hidden access via /auth/admin
 *
 * ENROLLMENT REFRESH POLICY:
 * - Enrollments are refreshed every 24 hours
 * - If user no longer exists in LearnWorlds → immediate session invalidation
 * - This ensures access is revoked within 24 hours of losing course access
 *
 * Cookie Strategy:
 * - mojitax-auth: Contains user role ('user' | 'admin')
 * - mojitax-session: Contains full session data (LearnWorlds user info, enrollments)
 * - mojitax-dev-auth: Development mode auth (backward compatibility)
 */

// Enrollment refresh interval: 24 hours in milliseconds
const ENROLLMENT_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

// Main site URL for redirect
const MAIN_SITE_URL = 'https://www.mojitax.co.uk';

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';
const DEV_AUTH_COOKIE_NAME = 'mojitax-dev-auth';

// Routes that DON'T require authentication
const publicRoutes = [
  '/',               // Home page
  '/tools',          // Public tools page
  '/auth',           // All auth routes (email verification, admin login, etc.)
  '/api/auth',       // Auth API endpoints
  '/api/learnworlds', // LearnWorlds API (for SSO callbacks)
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
  lastEnrollmentCheck?: string;
} | null {
  if (!sessionCookie) return null;

  try {
    return JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
  } catch {
    return null;
  }
}

/**
 * Check if enrollment refresh is needed (every 24 hours)
 */
function needsEnrollmentRefresh(session: ReturnType<typeof parseSession>): boolean {
  // No session or admin - no refresh needed
  if (!session || session.role === 'admin' || session.role === 'super_admin') {
    return false;
  }

  // No LearnWorlds ID - not a LearnWorlds user, no refresh needed
  if (!session.learnworldsId) {
    return false;
  }

  // No previous check - needs refresh
  if (!session.lastEnrollmentCheck) {
    return true;
  }

  // Check if 24 hours have passed since last check
  const lastCheck = new Date(session.lastEnrollmentCheck).getTime();
  const now = Date.now();
  return now - lastCheck > ENROLLMENT_REFRESH_INTERVAL;
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
  // NO-DOOR PLATFORM - Redirect to main site if not authenticated
  // ========================================
  if (!authenticated) {
    // Not authenticated - redirect to MojiTax main site
    // Users must log in via mojitax.co.uk first
    return NextResponse.redirect(MAIN_SITE_URL);
  }

  // ========================================
  // ENROLLMENT REFRESH - Check every 24 hours
  // If user no longer exists in LearnWorlds, session will be invalidated
  // ========================================
  if (needsEnrollmentRefresh(session)) {
    // Redirect to refresh endpoint, which will verify user and update enrollments
    const refreshUrl = new URL('/api/auth/refresh-session', request.url);
    refreshUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(refreshUrl);
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
