// Compute the next display_order for a child row given its parent scope.
// Used by POST handlers that mint new sample_locations / location_findings
// / location_sources / scope_items — the wizard never chooses an order
// number, the server just appends to the end.
//
// supabase: a configured server client.
// table:    fully-qualified table name ('location_findings', etc.).
// scope:    { column, value } — the FK that bounds the per-parent ordering.
export async function nextDisplayOrder(supabase, table, scope) {
  const { data } = await supabase
    .from(table)
    .select("display_order")
    .eq(scope.column, scope.value)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? 0) + 1;
}
