import { adminListHandler } from "../../../../lib/admin/handler";
import { properties } from "../../../../lib/admin/types/properties";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(properties);
}
