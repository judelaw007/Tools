/**
 * Admin Authentication Utilities
 *
 * Handles admin authentication using Supabase Auth.
 * Admins must be registered in the admin_users table.
 */

import { createClient, createServiceClient } from './server';
import type { DbAdminUser } from './types';

export interface AdminSession {
  user: {
    id: string;
    email: string;
  };
  admin: DbAdminUser;
}

/**
 * Get current admin session
 * Returns null if not authenticated or not an admin
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  // Get current auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Check if user is an admin (use service client to bypass RLS)
  const serviceClient = createServiceClient();
  const { data: adminUser, error: adminError } = await serviceClient
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();

  if (adminError || !adminUser) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    admin: adminUser as DbAdminUser,
  };
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.admin.role === 'super_admin';
}

/**
 * Sign in admin with email and password
 */
export async function signInAdmin(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
  session?: AdminSession;
}> {
  const supabase = await createClient();

  // Sign in with Supabase Auth
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !data.user) {
    return {
      success: false,
      error: authError?.message || 'Authentication failed',
    };
  }

  // Check if user is an admin (use service client to bypass RLS)
  const serviceClient = createServiceClient();
  const { data: adminUser, error: adminError } = await serviceClient
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .eq('is_active', true)
    .single();

  if (adminError || !adminUser) {
    // Sign out if not an admin
    await supabase.auth.signOut();
    console.error('Admin check failed:', adminError?.message, 'User ID:', data.user.id);
    return {
      success: false,
      error: 'You do not have admin access',
    };
  }

  return {
    success: true,
    session: {
      user: {
        id: data.user.id,
        email: data.user.email || '',
      },
      admin: adminUser as DbAdminUser,
    },
  };
}

/**
 * Sign out admin
 */
export async function signOutAdmin(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  // First check if email belongs to an admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (!adminUser) {
    // Don't reveal if email exists or not
    return { success: true };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/admin/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}
