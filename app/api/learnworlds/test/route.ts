import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * GET /api/learnworlds/test
 *
 * Test endpoint to verify LearnWorlds API connection.
 * Fetches all courses using the LearnWorlds client with pagination.
 */
export async function GET(request: NextRequest) {
  const apiUrl = process.env.LEARNWORLDS_API_URL || '';
  const schoolUrl = process.env.LEARNWORLDS_SCHOOL_URL || '';
  const accessToken = process.env.LEARNWORLDS_ACCESS_TOKEN || '';
  const clientId = process.env.LEARNWORLDS_CLIENT_ID || '';

  // Check configuration
  const missing: string[] = [];
  if (!schoolUrl) missing.push('LEARNWORLDS_SCHOOL_URL');
  if (!apiUrl) missing.push('LEARNWORLDS_API_URL');
  if (!clientId) missing.push('LEARNWORLDS_CLIENT_ID');
  if (!accessToken) missing.push('LEARNWORLDS_ACCESS_TOKEN');

  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      configured: false,
      missing,
      message: 'LearnWorlds is not fully configured.',
    });
  }

  try {
    // Use the LearnWorlds client to fetch all courses (with pagination)
    const allCourses = await learnworlds.getCourses();

    const courses = allCourses.map((course) => ({
      id: course.id,
      title: course.title,
      type: course.type || 'course',
    }));

    return NextResponse.json({
      success: courses.length > 0,
      configured: true,
      message: courses.length > 0
        ? `Found ${courses.length} courses from LearnWorlds`
        : 'Connected but no courses found.',
      courseCount: courses.length,
      courses,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      configured: true,
      message: `Error fetching courses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      courseCount: 0,
      courses: [],
    });
  }
}
