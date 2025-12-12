import { NextRequest, NextResponse } from 'next/server';
import { signInAdmin } from '@/lib/supabase/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signInAdmin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: result.session?.user.email,
        role: result.session?.admin.role,
      },
      redirectTo: '/admin',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
