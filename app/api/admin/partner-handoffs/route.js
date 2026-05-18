import { adminListHandler } from "../../../../lib/admin/handler";
import { partnerHandoffs } from "../../../../lib/admin/types/partner-handoffs";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(partnerHandoffs);
}
