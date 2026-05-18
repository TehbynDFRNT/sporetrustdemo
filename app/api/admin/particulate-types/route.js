import { adminListHandler } from "../../../../lib/admin/handler";
import { particulateTypes } from "../../../../lib/admin/types/particulate-types";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(particulateTypes);
}
