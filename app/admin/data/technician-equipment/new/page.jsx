"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// Assign a piece of equipment (catalogue row) to a specific technician.
export default function NewTechnicianEquipmentPage() {
  const router = useRouter();

  const { data: techsData } = useQuery({
    queryKey: ["admin-table", "technicians"],
    queryFn: async () => {
      const res = await fetch("/api/admin/technicians", { cache: "no-store" });
      return res.json();
    },
  });
  const { data: equipData } = useQuery({
    queryKey: ["admin-table", "equipment-types"],
    queryFn: async () => {
      const res = await fetch("/api/admin/equipment-types", { cache: "no-store" });
      return res.json();
    },
  });
  const techs = techsData?.rows ?? [];
  const equipment = equipData?.rows ?? [];

  const [technicianId, setTechnicianId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [serial, setSerial] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/technician-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technician_id: Number(technicianId),
          equipment_type_id: Number(equipmentTypeId),
          asset_tag: assetTag || null,
          serial: serial || null,
          acquired_at: acquiredAt || null,
          active,
          notes: notes || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: (json) => {
      const id = json?.row?.technician_equipment_id;
      if (id) router.push(`/admin/data/technician-equipment/${id}`);
      else router.push("/admin/data/technician-equipment");
    },
  });

  return (
    <div className="admin-form-wrap">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/data/technician-equipment" className="admin-back">← Technician kit</Link>
          <h1>Assign equipment</h1>
        </div>
      </div>

      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
        <label className="admin-field">
          <span>Technician</span>
          <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} required>
            <option value="">— select —</option>
            {techs.map((t) => (
              <option key={t.technician_id} value={t.technician_id}>
                {t.name} · {t.role}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Equipment</span>
          <select value={equipmentTypeId} onChange={(e) => setEquipmentTypeId(e.target.value)} required>
            <option value="">— select —</option>
            {equipment.map((e2) => (
              <option key={e2.equipment_type_id} value={e2.equipment_type_id}>
                {e2.name} · {e2.category}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Asset tag</span>
          <input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="SR-MOIST-003" />
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
          <button type="submit" className="admin-btn admin-btn--primary" disabled={create.isPending}>
            {create.isPending ? "Assigning…" : "Assign"}
          </button>
          <Link href="/admin/data/technician-equipment" className="admin-btn admin-btn--ghost">Cancel</Link>
        </div>
        {create.isError ? <p className="admin-error">{String(create.error?.message || create.error)}</p> : null}
      </form>
    </div>
  );
}
