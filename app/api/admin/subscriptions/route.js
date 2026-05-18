import { adminListHandler } from "../../../../lib/admin/handler";
import { subscriptions } from "../../../../lib/admin/types/subscriptions";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(subscriptions);
}
