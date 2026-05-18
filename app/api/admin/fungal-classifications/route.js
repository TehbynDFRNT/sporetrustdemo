import { adminListHandler } from "../../../../lib/admin/handler";
import { fungalClassifications } from "../../../../lib/admin/types/fungal-classifications";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(fungalClassifications);
}
