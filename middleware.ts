import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication & Access Control Middleware
 *
 * Access Model (from MASTER-PLAN-v2.md):
 * - Admin users: Full access to everything
 * - MojiTax users: Access only to tools allocated to their enrolled courses
 * - Public users: Can view public tool previews only
 *
 * Cookie Strategy:
 * - mojitax-auth: Contains user role ('user' | 'admin')
 * - mojitax-session: Contains full session data (LearnWorlds user info, enrollments)
 * - mojitax-dev-auth: Development mode auth (backward compatibility)
 */

const AUTH_COOKIE_NAME = 'mojitax-auth';
const SESSION_COOKIE_NAME = 'mojitax-session';
const DEV_AUTH_COOKIE_NAME = 'mojitax-dev-auth';

// Routes that require admin role ONLY
const adminOnlyRoutes = ['/admin'];

// Routes that require authentication (admin OR enrolled user)
const protectedRoutes = ['/dashboard'];

// Routes that require authentication for full access (tool pages)
// Public can preview, but need auth for full access
const toolRoutes = ['/tools/'];

// Public routes - no auth required
const publicRoutes = ['/', '/tools', '/auth'];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  // ADMIN ROUTES - Admin only access
  // ========================================
  const isAdminRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute) {
    if (!admin) {
      // Not an admin - redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      loginUrl.searchParams.set('reason', 'admin_required');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ========================================
  // PROTECTED ROUTES - Any authenticated user
  // ========================================
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!authenticated) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ========================================
  // TOOL ROUTES - Check enrollment for full access
  // ========================================
  // Tool routes allow public preview, but full access requires enrollment
  // The actual enrollment check happens at the page level (server component)
  // Middleware just ensures basic auth for non-preview routes
  const isToolRoute = pathname.match(/^\/tools\/[^/]+$/);

  if (isToolRoute) {
    // Tool detail pages - allow access (page will check enrollment)
    // The page component will show preview or full access based on enrollment
    return NextResponse.next();
  }

  // ========================================
  // PUBLIC ROUTES - Allow all
  // ========================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|auth).*)',
  ],
};
