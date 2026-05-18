import { adminListHandler } from "../../../../lib/admin/handler";
import { airSampleNotableObjects } from "../../../../lib/admin/types/air-sample-notable-objects";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(airSampleNotableObjects);
}
