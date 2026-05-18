import { adminListHandler } from "../../../../lib/admin/handler";
import { inspections } from "../../../../lib/admin/types/inspections";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(inspections);
}
