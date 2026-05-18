import { createServerSupabaseClient } from "../supabase";
import { mockData } from "./mockData";

// Shared GET handler for /api/admin/<entity>/route.js. Each route file
// passes its type config; the handler queries the matching Supabase table,
// embeds FK lookups declared in config.embeds, and orders rows by
// config.orderBy.
//
// config.embeds — array of PostgREST embed fragments, e.g.
//   ["customers(name)", "properties(address_line, postcode)"]
//
// config.orderBy — array of { column, ascending? } sort keys, e.g.
//   [{ column: "group_label" }, { column: "display_order" }, { column: "trade_category_id" }]
// Falls back to the rowKey column (or first column) when omitted.
//
// Response shape: { rows, source: "supabase" | "mock", error? }.
export async function adminListHandler(config) {
  const slug = config.slug;
  const table = slug.replace(/-/g, "_");

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ rows: mockData[slug] ?? [], source: "mock" });
  }

  const select = ["*", ...(config.embeds ?? [])].join(", ");
  let query = supabase.from(table).select(select).limit(500);

  const orderBy = resolveOrderBy(config);
  for (const sort of orderBy) {
    query = query.order(sort.column, { ascending: sort.ascending !== false });
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      { rows: mockData[slug] ?? [], source: "mock", error: error.message },
      { status: 200 },
    );
  }

  return Response.json({ rows: data ?? [], source: "supabase" });
}

function resolveOrderBy(config) {
  if (Array.isArray(config.orderBy) && config.orderBy.length > 0) {
    return config.orderBy;
  }
  // Fallback: rowKey (composite or single) ascending. Gives deterministic UI.
  const key = Array.isArray(config.rowKey) ? config.rowKey : [config.rowKey];
  return key.map((column) => ({ column }));
}
