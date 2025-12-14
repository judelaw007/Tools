/**
 * Admin Courses List API
 *
 * Returns all courses from LearnWorlds for the student view dropdown.
 * Only accessible by admins.
 */

import { NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/server-session';

export async function GET() {
  // Only admins can access this
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch courses from LearnWorlds
    const apiUrl = process.env.LEARNWORLDS_API_URL;
    const accessToken = process.env.LEARNWORLDS_ACCESS_TOKEN;

    if (!apiUrl || !accessToken) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'LearnWorlds not configured',
      });
    }

    // Fetch all products (courses, bundles, subscriptions)
    const response = await fetch(`${apiUrl}/v2/courses`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Lw-Client': process.env.LEARNWORLDS_CLIENT_ID || '',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('LearnWorlds API error:', response.status);
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'Failed to fetch courses from LearnWorlds',
      });
    }

    const data = await response.json();

    // Extract courses (only type: course, not bundles or subscriptions)
    const courses = (data.data || [])
      .filter((item: { id: string; title: string; type?: string }) =>
        // Include all products for preview purposes
        true
      )
      .map((item: { id: string; title: string; type?: string }) => ({
        id: item.id,
        title: item.title,
        type: item.type || 'course',
      }));

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error('Courses list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
