import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client (Service Role)
 * -------------------------------------------------
 * Uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * MUST only be used in server-side code (API routes, Server Components).
 * NEVER import this in client-side files.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "ERROR: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env. Buka dashboard Supabase > Settings > API > service_role key untuk mendapatkannya. Key ini diperlukan untuk fitur Admin Dashboard.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
