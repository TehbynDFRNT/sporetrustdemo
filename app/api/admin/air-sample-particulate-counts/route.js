import { adminListHandler } from "../../../../lib/admin/handler";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler("air-sample-particulate-counts", "air_sample_particulate_counts");
}
