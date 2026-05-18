import { createServerSupabaseClient } from "../supabase";
import { mockData } from "./mockData";

// Shared GET handler for /api/admin/<entity>/route.js. Each route file
// calls adminListHandler(slug, table) — slug matches a key in mockData,
// table is the Postgres table name (underscore form).
//
// Behaviour:
//   - When Supabase env vars are present → query the real table and return
//     { rows, source: "supabase" }.
//   - When env is missing OR Supabase errors → return mock rows with
//     { source: "mock", error?: string } so the UI still renders.
export async function adminListHandler(slug, table) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return Response.json({ rows: mockData[slug] ?? [], source: "mock" });
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .limit(500);

  if (error) {
    return Response.json(
      { rows: mockData[slug] ?? [], source: "mock", error: error.message },
      { status: 200 },
    );
  }

  return Response.json({ rows: data ?? [], source: "supabase" });
}
