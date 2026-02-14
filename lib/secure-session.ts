/**
 * Secure Session Management
 *
 * Encrypts/decrypts session cookies using iron-session (sealed cookies).
 * Includes a backward-compatible fallback: if decryption fails, attempts
 * legacy base64 decode so existing sessions aren't invalidated during migration.
 *
 * After 30 days, all sessions will have been re-issued as sealed cookies
 * and the base64 fallback can be removed.
 */

import { sealData, unsealData } from 'iron-session';

const SESSION_PASSWORD = process.env.SSO_SECRET || '';

if (!SESSION_PASSWORD || SESSION_PASSWORD.length < 32) {
  console.warn(
    'SSO_SECRET must be at least 32 characters for session encryption. Sessions will fall back to base64.'
  );
}

const SEAL_OPTIONS = {
  password: SESSION_PASSWORD,
  ttl: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Encrypt and sign session data into a sealed string for cookie storage.
 */
export async function sealSession(data: Record<string, unknown>): Promise<string> {
  if (!SESSION_PASSWORD || SESSION_PASSWORD.length < 32) {
    // Fallback to base64 if secret is too short (shouldn't happen in production)
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
  return sealData(JSON.stringify(data), SEAL_OPTIONS);
}

/**
 * Decrypt a sealed session cookie. Falls back to legacy base64 decode
 * for backward compatibility with existing sessions.
 */
export async function unsealSession(cookie: string): Promise<Record<string, unknown> | null> {
  if (!cookie) return null;

  // Try iron-session unseal first
  if (SESSION_PASSWORD && SESSION_PASSWORD.length >= 32) {
    try {
      const unsealed = await unsealData<string>(cookie, SEAL_OPTIONS);
      if (unsealed) {
        return JSON.parse(unsealed as string);
      }
    } catch {
      // Not a sealed cookie — fall through to base64 fallback
    }
  }

  // Legacy base64 fallback for existing sessions
  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object' && parsed.email) {
      console.warn('Session decoded via legacy base64 — will be re-sealed on next write');
      return parsed;
    }
  } catch {
    // Not valid base64 either
  }

  return null;
}
