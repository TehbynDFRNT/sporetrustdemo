import { adminListHandler } from "../../../../lib/admin/handler";
import { locationFindings } from "../../../../lib/admin/types/location-findings";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(locationFindings);
}
