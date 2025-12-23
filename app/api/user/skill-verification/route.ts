/**
 * User Skill Verification API
 *
 * POST /api/user/skill-verification - Create a verification record for printing
 * Returns a token and verification URL for QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { getUserPortfolioMatrix } from '@/lib/skill-categories';
import { createVerification, SkillSnapshot } from '@/lib/skill-verifications';
import { logActivity, extractRequestInfo } from '@/lib/activity-logs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the actual base URL from the request
    // This ensures QR codes work correctly in both dev and production
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'https://mojitax.co.uk';

    // Get request body for selected skill IDs
    const body = await request.json().catch(() => ({}));
    const selectedSkillIds: string[] = body.selectedSkillIds || [];

    // Get user's full portfolio
    const portfolio = await getUserPortfolioMatrix(session.email);

    // Filter portfolio if specific skills were selected
    const filteredPortfolio = selectedSkillIds.length > 0
      ? portfolio.filter((entry) => selectedSkillIds.includes(entry.category.id))
      : portfolio;

    // Helper to convert Date or string to ISO string
    const toISOString = (date: Date | string): string => {
      if (date instanceof Date) {
        return date.toISOString();
      }
      return typeof date === 'string' ? date : new Date(date).toISOString();
    };

    // Build the snapshot
    const skillsSnapshot: SkillSnapshot = {
      categories: filteredPortfolio.map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        courses: entry.completedCourses.map((course) => ({
          courseId: course.courseId,
          courseName: course.courseName,
          knowledgeDescription: course.knowledgeDescription,
          progressScore: course.progressScore,
          completedAt: toISOString(course.completedAt),
        })),
        tools: entry.toolsUsed.map((tool) => ({
          toolId: tool.toolId,
          toolName: tool.toolName,
          applicationDescription: tool.applicationDescription,
          projectCount: tool.projectCount,
          lastUsedAt: toISOString(tool.lastUsedAt),
        })),
      })),
      generatedAt: new Date().toISOString(),
    };

    // Get user's display name
    const userName = session.learnworldsUser?.username || session.email.split('@')[0];

    // Create verification record with the correct base URL
    const result = await createVerification(
      session.email,
      userName,
      skillsSnapshot,
      selectedSkillIds,
      baseUrl
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create verification' },
        { status: 500 }
      );
    }

    // Log the skills download/print activity
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logActivity({
      type: 'skills_download',
      userEmail: session.email,
      userName,
      description: `${userName} generated skills portfolio for printing/download`,
      metadata: {
        categoriesCount: skillsSnapshot.categories.length,
        selectedSkillIds: selectedSkillIds.length > 0 ? selectedSkillIds : 'all',
        verificationToken: result.token.substring(0, 8) + '...',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      token: result.token,
      verificationUrl: result.verificationUrl,
      snapshot: skillsSnapshot,
      userName,
    });
  } catch (error) {
    console.error('POST /api/user/skill-verification error:', error);
    return NextResponse.json(
      { error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}
