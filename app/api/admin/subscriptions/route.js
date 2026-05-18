import { mockData } from "../../../../lib/admin/mockData";

export const runtime = "nodejs";

// Mock route until Supabase is wired up. When live: query Supabase server
// client (gated by Clerk auth) and return { rows: [...] }.
export async function GET() {
  return Response.json({ rows: mockData["subscriptions"] ?? [] });
}
