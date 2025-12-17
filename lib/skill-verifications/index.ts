/**
 * Skill Verification Library
 *
 * Handles creating and verifying skill portfolio snapshots for print/PDF.
 * Each verification gets a unique token that can be encoded in a QR code.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseInstance;
}

export interface SkillSnapshot {
  categories: Array<{
    id: string;
    name: string;
    courses: Array<{
      courseId: string;
      courseName: string;
      knowledgeDescription: string | null;
      progressScore: number;
      completedAt: string;
    }>;
    tools: Array<{
      toolId: string;
      toolName: string;
      applicationDescription: string | null;
      projectCount: number;
      lastUsedAt: string;
    }>;
  }>;
  generatedAt: string;
}

export interface VerificationRecord {
  id: string;
  token: string;
  userEmail: string;
  userName: string | null;
  skillsSnapshot: SkillSnapshot;
  selectedSkillIds: string[];
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
}

/**
 * Generate a URL-safe verification token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a new skill verification record
 * Returns the verification token for QR code generation
 */
export async function createVerification(
  userEmail: string,
  userName: string | null,
  skillsSnapshot: SkillSnapshot,
  selectedSkillIds: string[]
): Promise<{ token: string; verificationUrl: string } | null> {
  const token = generateToken();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('skill_verifications')
    .insert({
      token,
      user_email: userEmail,
      user_name: userName,
      skills_snapshot: skillsSnapshot,
      selected_skill_ids: selectedSkillIds,
    })
    .select('token')
    .single();

  if (error) {
    console.error('Error creating verification:', error);
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify/skills/${token}`;

  return { token: data.token, verificationUrl };
}

/**
 * Get a verification record by token
 * Also increments the view count
 */
export async function getVerification(token: string): Promise<VerificationRecord | null> {
  const supabase = getSupabase();

  // First, get the verification
  const { data, error } = await supabase
    .from('skill_verifications')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    console.error('Error fetching verification:', error);
    return null;
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Increment view count
  await supabase
    .from('skill_verifications')
    .update({ view_count: data.view_count + 1 })
    .eq('token', token);

  return {
    id: data.id,
    token: data.token,
    userEmail: data.user_email,
    userName: data.user_name,
    skillsSnapshot: data.skills_snapshot as SkillSnapshot,
    selectedSkillIds: data.selected_skill_ids || [],
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    viewCount: data.view_count + 1,
  };
}

/**
 * Get all verifications for a user (for history/management)
 */
export async function getUserVerifications(userEmail: string): Promise<VerificationRecord[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('skill_verifications')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching user verifications:', error);
    return [];
  }

  return data.map((record) => ({
    id: record.id,
    token: record.token,
    userEmail: record.user_email,
    userName: record.user_name,
    skillsSnapshot: record.skills_snapshot as SkillSnapshot,
    selectedSkillIds: record.selected_skill_ids || [],
    createdAt: record.created_at,
    expiresAt: record.expires_at,
    viewCount: record.view_count,
  }));
}
