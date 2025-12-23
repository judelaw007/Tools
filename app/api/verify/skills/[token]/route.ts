/**
 * Public Skill Verification API
 *
 * GET /api/verify/skills/[token] - Get verification data by token
 * This is a public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVerification } from '@/lib/skill-verifications';
import { logActivity, extractRequestInfo } from '@/lib/activity-logs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const verification = await getVerification(token);

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found or expired' },
        { status: 404 }
      );
    }

    // Log the verification activity
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logActivity({
      type: 'skills_verification',
      userEmail: verification.userEmail,
      userName: verification.userName,
      description: `Skills portfolio verified for ${verification.userName}`,
      metadata: {
        token: token.substring(0, 8) + '...', // Only log partial token
        viewCount: verification.viewCount,
        categoriesCount: verification.skillsSnapshot.categories.length,
      },
      ipAddress,
      userAgent,
    });

    // Return verification data (hide email for privacy)
    return NextResponse.json({
      success: true,
      verification: {
        userName: verification.userName,
        skillsSnapshot: verification.skillsSnapshot,
        createdAt: verification.createdAt,
        viewCount: verification.viewCount,
      },
    });
  } catch (error) {
    console.error('GET /api/verify/skills/[token] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}
