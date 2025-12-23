/**
 * User Profile API Routes
 *
 * GET  /api/user/profile - Get user profile (including portfolio name)
 * PUT  /api/user/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface UserProfile {
  userEmail: string;
  portfolioName: string | null;
}

/**
 * GET /api/user/profile
 * Get the current user's profile
 */
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Get or create profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_email', session.email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (profile doesn't exist yet)
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Return profile data (or defaults if no profile exists)
    const userProfile: UserProfile = {
      userEmail: session.email,
      portfolioName: profile?.portfolio_name || null,
    };

    // Also include the default name from LearnWorlds for reference
    const defaultName = session.learnworldsUser?.username || session.email.split('@')[0];

    return NextResponse.json({
      success: true,
      profile: userProfile,
      defaultName,
    });
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update the current user's profile
 *
 * Body:
 * - portfolioName: string | null
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { portfolioName } = body;

    const supabase = getSupabase();

    // Upsert the profile (create if doesn't exist, update if it does)
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_email: session.email,
          portfolio_name: portfolioName?.trim() || null,
        },
        {
          onConflict: 'user_email',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        userEmail: session.email,
        portfolioName: data.portfolio_name,
      },
    });
  } catch (error) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
