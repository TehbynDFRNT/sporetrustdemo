"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function EditTechnicianEquipmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams();
  const id = String(params?.id ?? "");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-technician-equipment", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/technician-equipment/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Kit ${id} → ${res.status}`);
      return res.json();
    },
    enabled: Boolean(id),
  });
  const row = data?.row;

  const [assetTag, setAssetTag] = useState("");
  const [serial, setSerial] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!row) return;
    setAssetTag(row.asset_tag || "");
    setSerial(row.serial || "");
    setAcquiredAt(row.acquired_at || "");
    setActive(Boolean(row.active));
    setNotes(row.notes || "");
  }, [row]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/technician-equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag || null,
          serial: serial || null,
          acquired_at: acquiredAt || null,
          active,
          notes: notes || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save → ${res.status}`);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-technician-equipment", id] });
      qc.invalidateQueries({ queryKey: ["admin-table", "technician-equipment"] });
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!confirm("Delete this kit assignment? Any inspection_equipment + moisture_reading + air_sample references to it will be cascaded / nulled.")) return null;
      const res = await fetch(`/api/admin/technician-equipment/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Delete → ${res.status}`);
      }
      return true;
    },
    onSuccess: (ok) => {
      if (!ok) return;
      qc.invalidateQueries({ queryKey: ["admin-table", "technician-equipment"] });
      router.push("/admin/data/technician-equipment");
    },
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError)   return <p className="admin-error">{String(error?.message || error)}</p>;
  if (!row)      return <p>Not found.</p>;

  return (
    <div className="admin-form-wrap">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/data/technician-equipment" className="admin-back">← Technician kit</Link>
          <h1>Edit assignment #{id}</h1>
        </div>
      </div>

      <p className="admin-hint">
        Tech → equipment links are immutable here. Delete + recreate to swap. Asset tag / serial / dates are editable.
      </p>

      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <label className="admin-field">
          <span>Asset tag</span>
          <input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Serial</span>
          <input value={serial} onChange={(e) => setSerial(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Acquired</span>
          <input type="date" value={acquiredAt} onChange={(e) => setAcquiredAt(e.target.value)} />
        </label>
        <label className="admin-field admin-field--inline">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Active</span>
        </label>
        <label className="admin-field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
