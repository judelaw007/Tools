/**
 * Verification Code Management
 *
 * Stores and validates email verification codes for secure authentication.
 * Codes expire after 5 minutes and are single-use.
 */

interface VerificationCode {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

// In-memory storage for verification codes
// In production, consider using Redis or Supabase for multi-instance support
const verificationCodes: Map<string, VerificationCode> = new Map();

// Configuration
const CODE_LENGTH = 6;
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between code requests

// Track when codes were last sent (for rate limiting)
const lastCodeSent: Map<string, number> = new Map();

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
export function createVerificationCode(email: string): {
  success: boolean;
  code?: string;
  error?: string;
  retryAfter?: number;
} {
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit
  const lastSent = lastCodeSent.get(normalizedEmail);
  if (lastSent) {
    const timeSinceLastCode = Date.now() - lastSent;
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
  const expiresAt = Date.now() + CODE_EXPIRY_MS;

  // Store the code
  verificationCodes.set(normalizedEmail, {
    code,
    email: normalizedEmail,
    expiresAt,
    attempts: 0,
  });

  // Update rate limit tracker
  lastCodeSent.set(normalizedEmail, Date.now());

  return { success: true, code };
}

/**
 * Verify a code for an email
 * Returns success if code is valid and not expired
 */
export function verifyCode(email: string, code: string): {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
} {
  const normalizedEmail = email.toLowerCase().trim();
  const storedData = verificationCodes.get(normalizedEmail);

  // No code found
  if (!storedData) {
    return {
      success: false,
      error: 'No verification code found. Please request a new code.'
    };
  }

  // Check expiry
  if (Date.now() > storedData.expiresAt) {
    verificationCodes.delete(normalizedEmail);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  // Check attempts
  if (storedData.attempts >= MAX_ATTEMPTS) {
    verificationCodes.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many attempts. Please request a new code.'
    };
  }

  // Increment attempts
  storedData.attempts++;

  // Verify code (case-insensitive, trim whitespace)
  if (storedData.code !== code.trim()) {
    const attemptsRemaining = MAX_ATTEMPTS - storedData.attempts;
    return {
      success: false,
      error: `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      attemptsRemaining
    };
  }

  // Success - remove the code (single-use)
  verificationCodes.delete(normalizedEmail);
  lastCodeSent.delete(normalizedEmail);

  return { success: true };
}

/**
 * Clean up expired codes (call periodically)
 */
export function cleanupExpiredCodes(): number {
  let cleaned = 0;
  const now = Date.now();

  verificationCodes.forEach((data, email) => {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
      cleaned++;
    }
  });

  return cleaned;
}

/**
 * Get code expiry time in seconds (for UI display)
 */
export function getCodeExpirySeconds(): number {
  return CODE_EXPIRY_MS / 1000;
}
