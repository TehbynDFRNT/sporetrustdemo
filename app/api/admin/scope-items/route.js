import { adminListHandler } from "../../../../lib/admin/handler";
import { scopeItems } from "../../../../lib/admin/types/scope-items";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(scopeItems);
}
