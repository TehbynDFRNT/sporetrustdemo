import { adminListHandler } from "../../../../lib/admin/handler";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler("air-sample-notable-objects", "air_sample_notable_objects");
}
