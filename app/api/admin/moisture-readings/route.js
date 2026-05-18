import { adminListHandler } from "../../../../lib/admin/handler";
import { moistureReadings } from "../../../../lib/admin/types/moisture-readings";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(moistureReadings);
}
