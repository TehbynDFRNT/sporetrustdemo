import { adminListHandler } from "../../../../lib/admin/handler";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler("sample-locations", "sample_locations");
}
