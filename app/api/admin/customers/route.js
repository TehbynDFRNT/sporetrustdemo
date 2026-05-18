import { adminListHandler } from "../../../../lib/admin/handler";
import { customers } from "../../../../lib/admin/types/customers";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(customers);
}
