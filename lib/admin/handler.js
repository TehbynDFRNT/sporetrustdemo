import { createServerSupabaseClient } from "../supabase";
import { mockData } from "./mockData";

// Shared GET handler for /api/admin/<entity>/route.js. Each route file
// passes its type config and the handler queries the matching Supabase
// table, optionally embedding FK lookups declared in config.embeds.
//
// config.embeds is an array of PostgREST embed fragments such as
//   ["customers(name)", "properties(address_line, postcode)"]
// Supabase resolves these against the FK constraints defined in schema.sql.
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
  const { data, error } = await supabase.from(table).select(select).limit(500);

  if (error) {
    return Response.json(
      { rows: mockData[slug] ?? [], source: "mock", error: error.message },
      { status: 200 },
    );
  }

  return Response.json({ rows: data ?? [], source: "supabase" });
}
