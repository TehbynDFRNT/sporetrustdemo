import { adminListHandler } from "../../../../lib/admin/handler";
import { leads } from "../../../../lib/admin/types/leads";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(leads);
}
