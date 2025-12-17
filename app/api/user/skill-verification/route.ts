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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Create verification record
    const result = await createVerification(
      session.email,
      userName,
      skillsSnapshot,
      selectedSkillIds
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create verification' },
        { status: 500 }
      );
    }

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
