import { adminListHandler } from "../../../../lib/admin/handler";
import { imageCaptures } from "../../../../lib/admin/types/image-captures";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(imageCaptures);
}

// POST handles a wizard image upload. Accepts multipart/form-data with:
//   file               — the image (image/jpeg, image/png, image/webp)
//   inspection_id      — for the storage path
//   sample_location_id — FK on the row
//   capture_kind       — 'visible' | 'thermal'
//   pair_group         — integer, defaults to 1
//   caption            — optional
//
// Two steps: upload to Supabase Storage under
//   <inspection_id>/<sample_location_id>/<pair_group>-<kind>-<ts>.<ext>
// then insert an image_captures row with the storage_path. We do an upsert
// on the storage object so re-shooting before deleting the previous row
// just overwrites the file rather than failing.
export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let form;
  try {
    form = await req.formData();
  } catch (err) {
    return Response.json({ error: `Bad multipart: ${err.message}` }, { status: 400 });
  }

  const file = form.get("file");
  const inspection_id = Number(form.get("inspection_id"));
  const sample_location_id = Number(form.get("sample_location_id"));
  const capture_kind = String(form.get("capture_kind") || "");
  const pair_group = Number(form.get("pair_group") || 1);
  const caption = form.get("caption") ? String(form.get("caption")) : null;

  if (!file || typeof file === "string") {
    return Response.json({ error: "file required" }, { status: 400 });
  }
  if (!Number.isFinite(inspection_id) || !Number.isFinite(sample_location_id)) {
    return Response.json({ error: "inspection_id + sample_location_id required" }, { status: 400 });
  }
  const ALLOWED_KINDS = ["visible", "thermal", "moisture_evidence", "air_evidence"];
  if (!ALLOWED_KINDS.includes(capture_kind)) {
    return Response.json(
      { error: `capture_kind must be one of: ${ALLOWED_KINDS.join(", ")}` },
      { status: 400 },
    );
  }

  const ext = pickExt(file.type, file.name);
  const ts = Date.now();
  const path = `${inspection_id}/${sample_location_id}/${pair_group}-${capture_kind}-${ts}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("inspection-images")
    .upload(path, bytes, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });
  if (uploadErr) {
    return Response.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const row = {
    sample_location_id,
    capture_kind,
    pair_group,
    storage_path: path,
    caption,
  };
  const { data, error } = await supabase
    .from("image_captures")
    .insert(row)
    .select()
    .single();
  if (error) {
    // Roll back the storage object if the DB write failed so we don't leak.
    await supabase.storage.from("inspection-images").remove([path]).catch(() => {});
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ row: data, publicUrl: publicUrlFor(path) });
}

function pickExt(mime, filename) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (typeof filename === "string") {
    const m = filename.match(/\.([a-z0-9]+)$/i);
    if (m) return m[1].toLowerCase();
  }
  return "jpg";
}

function publicUrlFor(path) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/inspection-images/${path}`;
}
