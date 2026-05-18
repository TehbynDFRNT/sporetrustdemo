import { adminListHandler } from "../../../../lib/admin/handler";
import { technicians } from "../../../../lib/admin/types/technicians";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(technicians);
}
