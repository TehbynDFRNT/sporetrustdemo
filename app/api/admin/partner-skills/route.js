import { adminListHandler } from "../../../../lib/admin/handler";
import { partnerSkills } from "../../../../lib/admin/types/partner-skills";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(partnerSkills);
}
