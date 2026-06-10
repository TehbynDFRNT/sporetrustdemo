// One-off: upload the rotated lab slide to the air-slides bucket and
// point both seeded air_samples rows at it. Run: node scripts/upload-lab-slide.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY out of .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env manually (no dotenv import; we only need two vars).
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BUCKET = "air-slides";
const UPLOADS = [
  { local: "/tmp/slide-rotated.png",            remote: "1/sample-trace-4x.png" },
  { local: "/Users/tehbynnova/Desktop/30xZoom.png", remote: "1/sample-30x.png"   },
];

for (const u of UPLOADS) {
  console.log(`Uploading ${u.local} → ${BUCKET}/${u.remote} …`);
  const bytes = readFileSync(u.local);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(u.remote, bytes, { contentType: "image/png", upsert: true });
  if (upErr) {
    console.error("  Upload failed:", upErr.message);
    process.exit(1);
  }
  console.log(`  uploaded (${bytes.length} bytes).`);
}

console.log("Updating air_samples rows …");
const { data, error: updErr } = await supabase
  .from("air_samples")
  .update({
    slide_trace_4x_outside_path: "1/sample-trace-4x.png",
    slide_trace_4x_inside_path:  "1/sample-trace-4x.png",
    slide_30x_zoomed_path:        "1/sample-30x.png",
  })
  .in("air_sample_id", [1, 2])
  .select("air_sample_id, slide_trace_4x_inside_path, slide_30x_zoomed_path");
if (updErr) {
  console.error("Update failed:", updErr.message);
  process.exit(1);
}
console.log("  updated:", data);
