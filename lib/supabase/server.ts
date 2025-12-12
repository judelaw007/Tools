import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none' }) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle cookie errors in server components
          }
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handle cookie errors in server components
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role (for admin operations)
 * Only use this for server-side operations that need to bypass RLS
 * Note: Using untyped client to avoid type inference issues with update/upsert
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );
}
