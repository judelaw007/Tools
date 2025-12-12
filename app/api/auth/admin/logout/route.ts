import { NextResponse } from 'next/server';
import { signOutAdmin } from '@/lib/supabase/admin-auth';

export async function POST() {
  try {
    await signOutAdmin();

    return NextResponse.json({
      success: true,
      redirectTo: '/auth/admin',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
