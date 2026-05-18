import { adminListHandler } from "../../../../lib/admin/handler";
import { airSampleParticulateCounts } from "../../../../lib/admin/types/air-sample-particulate-counts";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(airSampleParticulateCounts);
}
