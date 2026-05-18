import { adminListHandler } from "../../../../lib/admin/handler";
import { imageCaptures } from "../../../../lib/admin/types/image-captures";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(imageCaptures);
}
