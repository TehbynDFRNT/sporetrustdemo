import { adminListHandler } from "../../../../lib/admin/handler";
import { airSamples } from "../../../../lib/admin/types/air-samples";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(airSamples);
}
