// One-off: upload the public/images/bedroom-* + bathroom-* demo photos
// into the inspection-images storage bucket and point image_captures
// rows at them. Same pattern as upload-lab-slide.mjs.
//
// Run: node scripts/upload-demo-room-images.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
  console.error("Missing env vars");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ROOT = new URL("../public/images/", import.meta.url).pathname;
const BUCKET = "inspection-images";

// (local file, bucket-relative storage path, image_capture_id to update)
const UPLOADS = [
  { local: `${ROOT}bedroom-visible.jpg`, remote: "1/bedroom-visible.jpg",  captureId: 1 },
  { local: `${ROOT}bedroom-thermal.jpg`, remote: "1/bedroom-thermal.jpg",  captureId: 2 },
  { local: `${ROOT}bathroom-visible.jpg`, remote: "3/laundry-visible.jpg", captureId: 3 },
  { local: `${ROOT}bathroom-thermal.jpg`, remote: "3/laundry-thermal.jpg", captureId: 4 },
];

for (const u of UPLOADS) {
  console.log(`Uploading ${u.local} → ${BUCKET}/${u.remote} …`);
  const bytes = readFileSync(u.local);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(u.remote, bytes, { contentType: "image/jpeg", upsert: true });
  if (upErr) {
    console.error("  Upload failed:", upErr.message);
    process.exit(1);
  }
  console.log(`  uploaded (${bytes.length} bytes).`);

  const { error: updErr } = await supabase
    .from("image_captures")
    .update({ storage_path: u.remote })
    .eq("image_capture_id", u.captureId);
  if (updErr) {
    console.error("  Update failed:", updErr.message);
    process.exit(1);
  }
  console.log(`  image_capture #${u.captureId} → ${u.remote}.`);
}
