import { createClient } from "@supabase/supabase-js";

// Lazy singletons. Mirrors the DFRNT Leads pattern (lib/supabase.ts).
//
// - createBrowserSupabaseClient — uses the anon (publishable) key. RLS
//   enforces row access. Safe to ship to the client.
// - createServerSupabaseClient — uses the service-role key, bypasses RLS.
//   Use ONLY from server contexts (API routes, server actions, server
//   components). Throws if SUPABASE_SERVICE_ROLE_KEY is not set so a
//   misconfigured deploy fails loudly instead of silently exposing data.
//
// Both functions return null when the corresponding env vars are missing,
// so admin API routes can fall back to mock data while Supabase is being
// provisioned.

let _browserClient = null;

export function createBrowserSupabaseClient() {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  _browserClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _browserClient;
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) return null;
  if (!serviceKey) {
    // Soft-fail: the publishable key still works for reads against tables
    // that don't have RLS enabled yet. Server routes that need to write
    // should check for null and surface a 503.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) return null;
    return createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
