import { adminListHandler } from "../../../../lib/admin/handler";
import { locationSources } from "../../../../lib/admin/types/location-sources";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(locationSources);
}
