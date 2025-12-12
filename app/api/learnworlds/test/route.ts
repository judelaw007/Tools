import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * GET /api/learnworlds/test
 *
 * Test endpoint to verify LearnWorlds API connection.
 * Fetches all products (courses, bundles, subscriptions) from LearnWorlds.
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
    // Fetch all products (courses, bundles, subscriptions)
    const allProducts = await learnworlds.getAllProducts();

    const products = allProducts.map((product) => ({
      id: product.id,
      title: product.title,
      type: product.type || 'course',
    }));

    // Count by type
    const courseCount = products.filter(p => p.type === 'course').length;
    const bundleCount = products.filter(p => p.type === 'bundle').length;
    const subscriptionCount = products.filter(p => p.type === 'subscription').length;

    return NextResponse.json({
      success: products.length > 0,
      configured: true,
      message: products.length > 0
        ? `Found ${courseCount} courses, ${bundleCount} bundles, ${subscriptionCount} subscriptions`
        : 'Connected but no products found.',
      courseCount: products.length, // Total count (kept for backward compatibility)
      courses: products, // Products array (kept name for backward compatibility)
      breakdown: {
        courses: courseCount,
        bundles: bundleCount,
        subscriptions: subscriptionCount,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      configured: true,
      message: `Error fetching products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      courseCount: 0,
      courses: [],
    });
  }
}
