import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/learnworlds/test
 *
 * Test endpoint to verify LearnWorlds API connection.
 * Tests multiple API endpoints to find courses.
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

  const results: Record<string, unknown> = {
    apiUrl,
    schoolUrl,
    endpoints: {},
  };

  // Helper to test an endpoint
  async function testEndpoint(baseUrl: string, endpoint: string, name: string) {
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Lw-Client': clientId,
        },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text.substring(0, 500);
      }

      return {
        url,
        status: response.status,
        ok: response.ok,
        data: response.ok ? data : null,
        error: !response.ok ? text.substring(0, 200) : null,
      };
    } catch (error) {
      return {
        url,
        status: 'error',
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test various endpoints
  const endpointsToTest = [
    { endpoint: '/v2/courses', name: 'courses_v2' },
    { endpoint: '/v2/products', name: 'products_v2' },
    { endpoint: '/courses', name: 'courses' },
    { endpoint: '/products', name: 'products' },
  ];

  // Test with API URL
  for (const { endpoint, name } of endpointsToTest) {
    results.endpoints[`apiUrl_${name}`] = await testEndpoint(apiUrl, endpoint, name);
  }

  // Also test with school URL if different
  if (schoolUrl !== apiUrl && !apiUrl.includes(schoolUrl)) {
    for (const { endpoint, name } of endpointsToTest) {
      results.endpoints[`schoolUrl_${name}`] = await testEndpoint(schoolUrl, endpoint, name);
    }
  }

  // Find working endpoint with courses
  let courses: Array<{ id: string; title: string; type?: string }> = [];
  let workingEndpoint = '';

  for (const [key, result] of Object.entries(results.endpoints as Record<string, { ok: boolean; data?: { data?: unknown[] } | unknown[] }>)) {
    if (result.ok && result.data) {
      const data = result.data;
      // Check if it's { data: [...] } or just [...]
      const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
      if (items.length > 0) {
        workingEndpoint = key;
        courses = items.slice(0, 10).map((item: Record<string, unknown>) => ({
          id: String(item.id || item._id || ''),
          title: String(item.title || item.name || ''),
          type: String(item.type || item.product_type || 'course'),
        }));
        break;
      }
    }
  }

  return NextResponse.json({
    success: courses.length > 0,
    configured: true,
    message: courses.length > 0
      ? `Found ${courses.length} courses via ${workingEndpoint}`
      : 'Connected but no courses found. Check the endpoints below for details.',
    workingEndpoint,
    courseCount: courses.length,
    courses,
    debug: results,
  });
}
