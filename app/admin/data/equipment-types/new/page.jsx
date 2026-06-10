"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

const CATEGORIES = ["moisture_meter", "thermal_camera", "air_sampler", "particle_counter", "hygrometer", "other"];

// Create a new equipment_type row. Image upload happens first (so the row
// can be inserted with image_storage_path already populated). Falls back
// to no image if upload is skipped.
export default function NewEquipmentTypePage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("moisture_meter");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [imagePath, setImagePath] = useState(null);
  const [imageStatus, setImageStatus] = useState("idle");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/equipment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, name, manufacturer: manufacturer || null,
          category, notes: notes || null,
          active, image_storage_path: imagePath,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: (json) => {
      const id = json?.row?.equipment_type_id;
      if (id) router.push(`/admin/data/equipment-types/${id}`);
      else router.push("/admin/data/equipment-types");
    },
  });

  async function uploadImage(file) {
    setImageStatus("uploading");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slug || `equipment-${Date.now()}`);
    const res = await fetch("/api/admin/equipment-images", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setImageStatus("error");
      return;
    }
    setImagePath(json.storage_path);
    setImageStatus("done");
  }

  return (
    <div className="admin-form-wrap">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/data/equipment-types" className="admin-back">← Equipment types</Link>
          <h1>New equipment type</h1>
        </div>
      </div>

      <form
        className="admin-form"
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      >
        <label className="admin-field">
          <span>Slug</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required placeholder="wagner-orion-940" />
        </label>
        <label className="admin-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Wagner Orion 940" />
        </label>
        <label className="admin-field">
          <span>Manufacturer</span>
          <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Wagner Meters" />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="admin-field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Card description — short, scannable." />
        </label>

        <div className="admin-field">
          <span>Card image</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
          />
          {imageStatus === "uploading" ? <p className="admin-hint">Uploading…</p> : null}
          {imageStatus === "done" && imagePath ? <p className="admin-hint">Uploaded: <code>{imagePath}</code></p> : null}
          {imageStatus === "error" ? <p className="admin-error">Upload failed.</p> : null}
        </div>

        <label className="admin-field admin-field--inline">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Active</span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create equipment type"}
          </button>
          <Link href="/admin/data/equipment-types" className="admin-btn admin-btn--ghost">Cancel</Link>
        </div>
        {create.isError ? <p className="admin-error">{String(create.error?.message || create.error)}</p> : null}
      </form>
    </div>
  );
}
