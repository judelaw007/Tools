/**
 * Student View API
 *
 * Allows admins to set a "student view" mode to preview the platform
 * as different types of students.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession, isCurrentUserAdmin } from '@/lib/server-session';

const STUDENT_VIEW_COOKIE = 'mojitax-student-view';

export async function POST(request: NextRequest) {
  // Only admins can use student view
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mode, selectedCourseId, selectedCourseName } = body;

    const cookieStore = await cookies();

    if (mode === 'admin') {
      // Clear the student view cookie
      cookieStore.delete(STUDENT_VIEW_COOKIE);
      return NextResponse.json({ success: true, mode: 'admin' });
    }

    // Set the student view cookie
    const viewState = {
      mode,
      selectedCourseId,
      selectedCourseName,
    };

    const encoded = Buffer.from(JSON.stringify(viewState)).toString('base64');
    cookieStore.set(STUDENT_VIEW_COOKIE, encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true, ...viewState });
  } catch (error) {
    console.error('Student view error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set student view' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const cookieStore = await cookies();
    const viewCookie = cookieStore.get(STUDENT_VIEW_COOKIE)?.value;

    if (!viewCookie) {
      return NextResponse.json({ success: true, mode: 'admin' });
    }

    const decoded = Buffer.from(viewCookie, 'base64').toString('utf-8');
    const viewState = JSON.parse(decoded);

    return NextResponse.json({ success: true, ...viewState });
  } catch (error) {
    return NextResponse.json({ success: true, mode: 'admin' });
  }
}
