/**
 * Admin Courses List API
 *
 * Returns all courses from LearnWorlds for the student view dropdown.
 * Only accessible by admins.
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase/admin-auth';
import { learnworlds } from '@/lib/learnworlds';

export async function GET() {
  // Only admins can access this
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if LearnWorlds is configured
    const configStatus = learnworlds.getConfigStatus();
    if (!configStatus.configured) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'LearnWorlds not configured',
      });
    }

    // Fetch all products (courses, bundles, subscriptions) using the learnworlds client
    const allProducts = await learnworlds.getAllProducts();

    // Map to simplified format for dropdown
    const courses = allProducts.map((item) => ({
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
