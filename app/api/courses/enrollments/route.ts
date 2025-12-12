import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { learnworlds, LearnWorldsEnrollment } from '@/lib/learnworlds';

const SESSION_COOKIE_NAME = 'mojitax-session';

interface SessionData {
  email: string;
  learnworldsId?: string;
}

/**
 * GET /api/courses/enrollments
 *
 * Returns the current user's course enrollments from LearnWorlds.
 * Used to determine which tools the user can access.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse session
    let session: SessionData;
    try {
      session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString()
      );
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get enrollments from LearnWorlds
    let enrollments: LearnWorldsEnrollment[] = [];

    if (session.learnworldsId) {
      enrollments = await learnworlds.getUserEnrollments(session.learnworldsId);
    } else if (session.email) {
      enrollments = await learnworlds.getUserEnrollmentsByEmail(session.email);
    }

    return NextResponse.json({
      success: true,
      enrollments: enrollments.map((e) => ({
        productId: e.product_id,
        productTitle: e.product_title,
        productType: e.product_type,
        enrolledAt: e.enrolled_at,
        expiresAt: e.expires_at,
        progress: e.progress,
        completed: e.completed,
      })),
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
