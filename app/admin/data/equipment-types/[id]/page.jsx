"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["moisture_meter", "thermal_camera", "air_sampler", "particle_counter", "hygrometer", "other"];

// Edit (and delete) an equipment_type. The form binds straight to the row
// and PATCHes on Save. Image replace re-uses the same upload endpoint.
export default function EditEquipmentTypePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams();
  const id = String(params?.id ?? "");
  const fileRef = useRef(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-equipment-type", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/equipment-types/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Equipment type ${id} → ${res.status}`);
      return res.json();
    },
    enabled: Boolean(id),
  });

  const row = data?.row;

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("moisture_meter");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [imagePath, setImagePath] = useState(null);
  const [imageStatus, setImageStatus] = useState("idle");

  useEffect(() => {
    if (!row) return;
    setSlug(row.slug || "");
    setName(row.name || "");
    setManufacturer(row.manufacturer || "");
    setCategory(row.category || "moisture_meter");
    setNotes(row.notes || "");
    setActive(Boolean(row.active));
    setImagePath(row.image_storage_path || null);
    setImageStatus("idle");
  }, [row]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/equipment-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, name, manufacturer: manufacturer || null,
          category, notes: notes || null, active,
          image_storage_path: imagePath,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save → ${res.status}`);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-equipment-type", id] });
      qc.invalidateQueries({ queryKey: ["admin-table", "equipment-types"] });
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!confirm(`Delete equipment type "${name}"? This will null out FKs on assigned kit (set to NULL).`)) return null;
      const res = await fetch(`/api/admin/equipment-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Delete → ${res.status}`);
      }
      return true;
    },
    onSuccess: (ok) => {
      if (!ok) return;
      qc.invalidateQueries({ queryKey: ["admin-table", "equipment-types"] });
      router.push("/admin/data/equipment-types");
    },
  });

  async function uploadImage(file) {
    setImageStatus("uploading");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slug || `equipment-${id}`);
    const res = await fetch("/api/admin/equipment-images", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setImageStatus("error"); return; }
    setImagePath(json.storage_path);
    setImageStatus("done");
  }

  if (isLoading) return <p>Loading…</p>;
  if (isError)   return <p className="admin-error">{String(error?.message || error)}</p>;
  if (!row)      return <p>Not found.</p>;

  const imgUrl = imagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/equipment-images/${imagePath}`
    : null;

  return (
    <div className="admin-form-wrap">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/data/equipment-types" className="admin-back">← Equipment types</Link>
          <h1>{row.name}</h1>
        </div>
      </div>

      <form
        className="admin-form"
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      >
        <label className="admin-field">
          <span>Slug</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required />
        </label>
        <label className="admin-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Manufacturer</span>
          <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="admin-field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        <div className="admin-field">
          <span>Card image</span>
          {imgUrl ? <img src={imgUrl} alt="" className="admin-form__thumb" /> : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
          />
          {imageStatus === "uploading" ? <p className="admin-hint">Uploading…</p> : null}
          {imageStatus === "done" && imagePath ? <p className="admin-hint">Uploaded — save to persist.</p> : null}
          {imageStatus === "error" ? <p className="admin-error">Upload failed.</p> : null}
        </div>

        <label className="admin-field admin-field--inline">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Active</span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => del.mutate()} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
        {save.isError ? <p className="admin-error">{String(save.error?.message || save.error)}</p> : null}
        {del.isError ? <p className="admin-error">{String(del.error?.message || del.error)}</p> : null}
      </form>
    </div>
  );
}
