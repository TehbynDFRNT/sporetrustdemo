import { adminListHandler } from "../../../../lib/admin/handler";
import { sampleLocations } from "../../../../lib/admin/types/sample-locations";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(sampleLocations);
}
