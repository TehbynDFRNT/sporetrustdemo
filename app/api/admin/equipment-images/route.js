import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

// Image upload for the equipment catalogue. Multipart POST with:
//   file       — the image
//   slug       — used to namespace the storage path
//
// Returns { storage_path, publicUrl }. The admin form then PATCHes the
// owning equipment_types row with image_storage_path = storage_path.
export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 503 });

  let form;
  try { form = await req.formData(); }
  catch (err) { return Response.json({ error: `Bad multipart: ${err.message}` }, { status: 400 }); }

  const file = form.get("file");
  const slug = String(form.get("slug") || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (!file || typeof file === "string") {
    return Response.json({ error: "file required" }, { status: 400 });
  }
  if (!slug) {
    return Response.json({ error: "slug required" }, { status: 400 });
  }

  const ext = pickExt(file.type, file.name);
  const ts = Date.now();
  const path = `${slug}-${ts}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("equipment-images")
    .upload(path, bytes, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });
  if (uploadErr) {
    return Response.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }
  return Response.json({ storage_path: path, publicUrl: publicUrlFor(path) });
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
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/equipment-images/${path}`;
}
