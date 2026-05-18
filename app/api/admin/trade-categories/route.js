import { adminListHandler } from "../../../../lib/admin/handler";
import { tradeCategories } from "../../../../lib/admin/types/trade-categories";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(tradeCategories);
}
