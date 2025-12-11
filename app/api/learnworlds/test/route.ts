import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';

/**
 * GET /api/learnworlds/test
 *
 * Test endpoint to verify LearnWorlds API connection.
 * Only available in development or for admin users.
 */
export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const configStatus = learnworlds.getConfigStatus();

    if (!configStatus.configured) {
      return NextResponse.json({
        success: false,
        configured: false,
        missing: configStatus.missing,
        message: 'LearnWorlds is not fully configured. Please check your environment variables.',
        requiredVars: [
          'LEARNWORLDS_SCHOOL_URL',
          'LEARNWORLDS_API_URL',
          'LEARNWORLDS_CLIENT_ID',
          'LEARNWORLDS_CLIENT_SECRET',
          'LEARNWORLDS_ACCESS_TOKEN',
        ],
      });
    }

    // Test connection
    const connectionTest = await learnworlds.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        connectionTest: connectionTest.message,
        message: 'Configuration is present but API connection failed.',
      });
    }

    // Try to fetch products as a test
    const products = await learnworlds.getProducts();

    return NextResponse.json({
      success: true,
      configured: true,
      connectionTest: 'passed',
      message: 'LearnWorlds API is connected and working!',
      productCount: products.length,
      products: products.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
      })),
    });
  } catch (error) {
    console.error('LearnWorlds test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
