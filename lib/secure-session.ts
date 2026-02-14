/**
 * Secure Session Management
 *
 * Encrypts/decrypts session cookies using Web Crypto API (AES-256-GCM).
 * Works in both Edge Runtime (middleware) and Node.js (API routes).
 *
 * Includes a backward-compatible fallback: if decryption fails, attempts
 * legacy base64 decode so existing sessions aren't invalidated during migration.
 */

const SESSION_PASSWORD = process.env.SSO_SECRET || '';

/**
 * Derive an AES-256 key from the password using PBKDF2
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_PASSWORD) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert Uint8Array to base64url string
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert base64url string to Uint8Array
 */
function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt and sign session data into a sealed string for cookie storage.
 */
export async function sealSession(data: Record<string, unknown>): Promise<string> {
  if (!SESSION_PASSWORD || SESSION_PASSWORD.length < 32) {
    // Fallback to base64 if secret is too short
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext as BufferSource
  );

  // Format: salt.iv.ciphertext (all base64url encoded)
  return `${toBase64Url(salt)}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypt a sealed session cookie. Falls back to legacy base64 decode
 * for backward compatibility with existing sessions.
 */
export async function unsealSession(cookie: string): Promise<Record<string, unknown> | null> {
  if (!cookie) return null;

  // Try our AES-GCM format first (contains two dots: salt.iv.ciphertext)
  if (SESSION_PASSWORD && SESSION_PASSWORD.length >= 32 && cookie.includes('.')) {
    try {
      const parts = cookie.split('.');
      if (parts.length === 3) {
        const salt = fromBase64Url(parts[0]);
        const iv = fromBase64Url(parts[1]);
        const ciphertext = fromBase64Url(parts[2]);

        const key = await deriveKey(salt);

        const plaintext = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          key,
          ciphertext as BufferSource
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(plaintext));
      }
    } catch {
      // Not a sealed cookie — fall through to base64 fallback
    }
  }

  // Legacy base64 fallback for existing sessions
  try {
    // Handle both Buffer (Node.js) and atob (Edge) environments
    let decoded: string;
    if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    } else {
      decoded = new TextDecoder().decode(fromBase64Url(cookie));
    }
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object' && parsed.email) {
      return parsed;
    }
  } catch {
    // Not valid base64 either
  }

  return null;
}
