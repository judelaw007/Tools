/**
 * Verification Code Management
 *
 * Stores and validates email verification codes using Supabase.
 * Codes expire after 5 minutes and are single-use.
 *
 * Required Supabase table:
 * CREATE TABLE verification_codes (
 *   email TEXT PRIMARY KEY,
 *   code TEXT NOT NULL,
 *   expires_at TIMESTAMPTZ NOT NULL,
 *   attempts INTEGER DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

import { createServiceClient } from '@/lib/supabase/server';

// Configuration
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between code requests

/**
 * Generate a random 6-digit numeric code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store a verification code for an email
 * Returns the code to be sent via email
 */
export async function createVerificationCode(email: string): Promise<{
  success: boolean;
  code?: string;
  error?: string;
  retryAfter?: number;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceClient();

  try {
    // Check if there's a recent code (rate limiting)
    const { data: existing } = await supabase
      .from('verification_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      const createdAt = new Date(existing.created_at).getTime();
      const timeSinceLastCode = Date.now() - createdAt;

      if (timeSinceLastCode < RATE_LIMIT_MS) {
        const retryAfter = Math.ceil((RATE_LIMIT_MS - timeSinceLastCode) / 1000);
        return {
          success: false,
          error: 'Please wait before requesting another code',
          retryAfter
        };
      }
    }

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

    // Upsert the code (insert or update if email exists)
    const { error: upsertError } = await supabase
      .from('verification_codes')
      .upsert({
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'email'
      });

    if (upsertError) {
      console.error('Error storing verification code:', upsertError);
      return {
        success: false,
        error: 'Failed to create verification code'
      };
    }

    return { success: true, code };
  } catch (error) {
    console.error('createVerificationCode error:', error);
    return {
      success: false,
      error: 'Failed to create verification code'
    };
  }
}

/**
 * Verify a code for an email
 * Returns success if code is valid and not expired
 */
export async function verifyCode(email: string, code: string): Promise<{
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceClient();

  try {
    // Fetch the stored code
    const { data: storedData, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError || !storedData) {
      return {
        success: false,
        error: 'No verification code found. Please request a new code.'
      };
    }

    // Check expiry
    const expiresAt = new Date(storedData.expires_at).getTime();
    if (Date.now() > expiresAt) {
      // Delete expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('email', normalizedEmail);

      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      };
    }

    // Check attempts
    if (storedData.attempts >= MAX_ATTEMPTS) {
      // Delete code after max attempts
      await supabase
        .from('verification_codes')
        .delete()
        .eq('email', normalizedEmail);

      return {
        success: false,
        error: 'Too many attempts. Please request a new code.'
      };
    }

    // Verify code
    if (storedData.code !== code.trim()) {
      // Increment attempts
      const newAttempts = storedData.attempts + 1;
      await supabase
        .from('verification_codes')
        .update({ attempts: newAttempts })
        .eq('email', normalizedEmail);

      const attemptsRemaining = MAX_ATTEMPTS - newAttempts;
      return {
        success: false,
        error: `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
        attemptsRemaining
      };
    }

    // Success - delete the code (single-use)
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', normalizedEmail);

    return { success: true };
  } catch (error) {
    console.error('verifyCode error:', error);
    return {
      success: false,
      error: 'Verification failed. Please try again.'
    };
  }
}

/**
 * Clean up expired codes (can be called periodically)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error cleaning up expired codes:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('cleanupExpiredCodes error:', error);
    return 0;
  }
}

/**
 * Get code expiry time in seconds (for UI display)
 */
export function getCodeExpirySeconds(): number {
  return CODE_EXPIRY_MS / 1000;
}
