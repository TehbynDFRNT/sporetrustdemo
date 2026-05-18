import { adminListHandler } from "../../../../lib/admin/handler";
import { airSampleFungalCounts } from "../../../../lib/admin/types/air-sample-fungal-counts";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(airSampleFungalCounts);
}
