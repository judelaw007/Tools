/**
 * Public Skill Verification API
 *
 * GET /api/verify/skills/[token] - Get verification data by token
 * This is a public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVerification } from '@/lib/skill-verifications';

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
