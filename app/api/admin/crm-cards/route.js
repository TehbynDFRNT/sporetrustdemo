import { adminListHandler } from "../../../../lib/admin/handler";
import { crmCards } from "../../../../lib/admin/types/crm-cards";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(crmCards);
}
