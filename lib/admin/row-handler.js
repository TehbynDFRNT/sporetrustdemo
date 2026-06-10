import { createServerSupabaseClient } from "../supabase";

// Shared single-row handler for /api/admin/<entity>/[id]/route.js.
//
// Differs from lib/admin/handler.js (which lists many rows for the data
// tables) — this fetches / patches / deletes one row by its primary key.
// Designed for the inspection-workspace wizard, where every field on a
// sample_location, image_capture, moisture_reading, etc. is bound to a
// debounced PATCH against this endpoint.
//
// config:
//   slug:    'sample-locations'             (becomes table 'sample_locations')
//   rowKey:  'sample_location_id'           (single PK column)
//   embeds:  optional PostgREST nested selects to return alongside the row
//   patchAllow: optional array of column names whitelist for PATCH
//   patchDeny:  optional array of column names blacklist for PATCH (always
//               also strips rowKey, created_at, updated_at)
//
// Each per-id route file passes its config + the awaited `id` param.

export async function adminRowGet(config, id) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const table = config.slug.replace(/-/g, "_");
  const select = ["*", ...(config.embeds ?? [])].join(", ");
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(config.rowKey, id)
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ row: data });
}

export async function adminRowPatch(config, id, patch) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const table = config.slug.replace(/-/g, "_");
  const cleaned = stripReadOnly(patch, config);
  if (Object.keys(cleaned).length === 0) {
    return Response.json({ error: "No mutable fields in patch" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from(table)
    .update(cleaned)
    .eq(config.rowKey, id)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}

export async function adminRowDelete(config, id) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const table = config.slug.replace(/-/g, "_");
  const { error } = await supabase.from(table).delete().eq(config.rowKey, id);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}

function stripReadOnly(patch, config) {
  const out = {};
  const denyBase = new Set([config.rowKey, "created_at", "updated_at"]);
  const deny = config.patchDeny ? new Set([...denyBase, ...config.patchDeny]) : denyBase;
  const allow = config.patchAllow ? new Set(config.patchAllow) : null;
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (deny.has(k)) continue;
    if (allow && !allow.has(k)) continue;
    out[k] = v;
  }
  return out;
}
