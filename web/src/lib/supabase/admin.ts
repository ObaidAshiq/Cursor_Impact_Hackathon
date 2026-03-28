import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function normalizeSupabaseUrl(raw: string | undefined): string {
  const u = raw?.trim() ?? "";
  if (!u) return "";
  // createClient expects https://<ref>.supabase.co — no trailing slash, no /rest/v1 suffix.
  return u.replace(/\/+$/, "").replace(/\/rest\/v1\/?$/i, "");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    normalizeSupabaseUrl(process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Service-role client for server-only usage (cron, RSC). Never import in client components.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
