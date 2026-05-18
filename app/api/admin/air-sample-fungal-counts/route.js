import { adminListHandler } from "../../../../lib/admin/handler";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler("air-sample-fungal-counts", "air_sample_fungal_counts");
}
