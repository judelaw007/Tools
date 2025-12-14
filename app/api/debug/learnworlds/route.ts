import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * GET /api/debug/learnworlds?email=xxx
 *
 * Debug endpoint to test LearnWorlds API directly.
 * Shows what the API actually returns for a given email.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter required',
        usage: '/api/debug/learnworlds?email=your@email.com',
      });
    }

    // Get config status
    const configStatus = learnworlds.getConfigStatus();

    if (!configStatus.configured) {
      return NextResponse.json({
        error: 'LearnWorlds not configured',
        missing: configStatus.missing,
      });
    }

    // Make raw API call to see what's returned
    const apiUrl = process.env.LEARNWORLDS_API_URL || '';
    const accessToken = process.env.LEARNWORLDS_ACCESS_TOKEN || '';
    const clientId = process.env.LEARNWORLDS_CLIENT_ID || '';

    // Test 1: Query with email parameter
    const emailQueryUrl = `${apiUrl}/v2/users?email=${encodeURIComponent(email)}`;
    const emailQueryResponse = await fetch(emailQueryUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Lw-Client': clientId,
      },
    });
    const emailQueryData = await emailQueryResponse.json();

    // Test 2: Get the user via our helper function
    const userViaHelper = await learnworlds.getUserByEmail(email);

    // Test 3: If user found, get their enrollments and courses (RAW)
    let rawEnrollments = null;
    let rawCourseAccess = null;
    let processedCourseAccess = null;

    if (userViaHelper) {
      // Get RAW enrollments response
      const enrollmentsUrl = `${apiUrl}/v2/users/${userViaHelper.id}/products`;
      const enrollmentsResponse = await fetch(enrollmentsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Lw-Client': clientId,
        },
      });
      rawEnrollments = await enrollmentsResponse.json();

      // Get RAW course access response
      const coursesUrl = `${apiUrl}/v2/users/${userViaHelper.id}/courses`;
      const coursesResponse = await fetch(coursesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Lw-Client': clientId,
        },
      });
      rawCourseAccess = await coursesResponse.json();

      // Also get processed version
      processedCourseAccess = await learnworlds.getUserCourseAccess(userViaHelper.id);
    }

    return NextResponse.json({
      searchedEmail: email,
      userFound: userViaHelper ? {
        id: userViaHelper.id,
        email: userViaHelper.email,
        username: userViaHelper.username,
      } : null,
      // Show RAW API responses to debug field names
      rawEnrollmentsResponse: rawEnrollments,
      rawCourseAccessResponse: rawCourseAccess,
      // Show what our code extracts (to compare)
      processedCourseIds: processedCourseAccess,
      // Hint for fixing
      sampleCourseFields: rawCourseAccess?.data?.[0] ? Object.keys(rawCourseAccess.data[0]) : [],
      sampleEnrollmentFields: rawEnrollments?.data?.[0] ? Object.keys(rawEnrollments.data[0]) : [],
    });
  } catch (error) {
    console.error('Debug LearnWorlds error:', error);
    return NextResponse.json({
      error: 'Failed to query LearnWorlds',
      details: String(error),
    }, { status: 500 });
  }
}
