import { adminListHandler } from "../../../../lib/admin/handler";
import { partnerOrganizations } from "../../../../lib/admin/types/partner-organizations";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(partnerOrganizations);
}
