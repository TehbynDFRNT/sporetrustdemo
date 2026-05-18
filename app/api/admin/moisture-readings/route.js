import { adminListHandler } from "../../../../lib/admin/handler";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler("moisture-readings", "moisture_readings");
}
