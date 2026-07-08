"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../../../lib/admin/useAutosaveRow";
import { useImageUpload, imageUrl } from "../../../../../../../lib/admin/useImageUpload";

const LEVELS = ["normal", "low", "moderate", "high", "severe"];

const SUPABASE_EQUIPMENT_BASE =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/equipment-images/`
    : "";

// Step 4 — Pin-first moisture readings.
//
// SOP flow (per the user's call):
//   1. Tap a spot on the wide visible reference → a new moisture_reading
//      is created with marker_x_pct + marker_y_pct already populated.
//   2. The new card auto-scrolls into view + auto-expands so the tech
//      can fill in surface label, value, level, equipment chip + evidence.
//   3. Existing pins on the image stay visible; tapping a pin scrolls to
//      its card.
//
// kit: this inspection's checked-off equipment (filtered to
// moisture_meter category for the per-reading chip select).
export default function Step4Moisture({ row, queryKey, inspectionId, locationId, kit, stepNumber }) {
  const qc = useQueryClient();
  const readings = (row.moisture_readings || [])
    .slice()
    .sort((a, b) => a.moisture_reading_id - b.moisture_reading_id);
  const moistureKit = (kit || []).filter(
    (k) => k.technician_equipment?.equipment_types?.category === "moisture_meter"
        || k.equipment_types?.category === "moisture_meter",
  );

  const visible = (row.image_captures || []).find(
    (c) => c.capture_kind === "visible" && c.pair_group === 1,
  );

  // Index every image_capture by id so individual cards can resolve their
  // evidence_image_capture_id → storage_path in O(1) without re-walking
  // the array per render.
  const capturesById = useMemo(
    () => new Map((row.image_captures || []).map((c) => [c.image_capture_id, c])),
    [row.image_captures],
  );

  const imgRef = useRef(null);
  const [focusedId, setFocusedId] = useState(null);

  const createAtPin = useMutation({
    mutationFn: async ({ x, y }) => {
      const res = await fetch("/api/admin/moisture-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_location_id: Number(locationId),
          // Server can't accept marker fields directly on create — we set
          // them via a follow-up PATCH so the placeholder defaults still
          // apply. (Cheap: one row insert + one row update.)
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      const newId = json?.row?.moisture_reading_id;
      if (newId) {
        await fetch(`/api/admin/moisture-readings/${newId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marker_x_pct: x, marker_y_pct: y }),
        });
      }
      return { id: newId };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey });
      if (id) {
        setFocusedId(id);
        // Scroll once the refetch lands the new row.
        setTimeout(() => {
          document
            .getElementById(`m-card-${id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    },
  });

  function handleImageClick(e) {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clamp = (v) => Math.max(0, Math.min(100, Number(v.toFixed(2))));
    createAtPin.mutate({ x: clamp(x), y: clamp(y) });
  }

  function handlePinClick(readingId, e) {
    e.stopPropagation();
    setFocusedId(readingId);
    document
      .getElementById(`m-card-${readingId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">{stepNumber} · Moisture readings</h2>
      <p className="wz-step__p">
        Tap the image where you took a reading. We create a pin + a fresh card below.
        Tap an existing pin to jump to its details. Fill in the meter chip, value, depth, and evidence.
      </p>

      {visible ? (
        <div className="wz-pin-canvas" onClick={handleImageClick}>
          <img
            ref={imgRef}
            src={imageUrl(visible.storage_path)}
            alt="Visible reference"
            className="wz-pin-canvas__img"
            draggable={false}
          />
          {readings.map((m, idx) => {
            const x = m.marker_x_pct;
            const y = m.marker_y_pct;
            if (x == null || y == null) return null;
            return (
              <button
                type="button"
                key={m.moisture_reading_id}
                className={`wz-pin wz-pin--${m.level || "normal"} ${focusedId === m.moisture_reading_id ? "is-armed" : ""}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={(ev) => handlePinClick(m.moisture_reading_id, ev)}
                aria-label={`Reading ${idx + 1}`}
                title={`#${idx + 1} · ${m.surface_label || "(unlabelled)"}`}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="ins-empty">Take the wide visible reference shot in Step 2 first.</p>
      )}

      <ol className="wz-list">
        {readings.length === 0 ? (
          <li className="ins-empty">No readings yet. Tap the image above to drop your first pin.</li>
        ) : (
          readings.map((m, idx) => (
            <li key={m.moisture_reading_id} id={`m-card-${m.moisture_reading_id}`}>
              <MoistureCard
                index={idx + 1}
                reading={m}
                queryKey={queryKey}
                inspectionId={inspectionId}
                locationId={locationId}
                kit={moistureKit}
                capturesById={capturesById}
                focused={focusedId === m.moisture_reading_id}
              />
            </li>
          ))
        )}
      </ol>

      {createAtPin.isError ? (
        <p className="ins-error">{String(createAtPin.error?.message || createAtPin.error)}</p>
      ) : null}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function MoistureCard({ index, reading, queryKey, inspectionId, locationId, kit, capturesById, focused }) {
  const qc = useQueryClient();
  const save = useAutosaveRow({
    endpoint: `/api/admin/moisture-readings/${reading.moisture_reading_id}`,
    invalidate: queryKey,
  });
  const upload = useImageUpload({ inspectionId, sampleLocationId: locationId, invalidate: queryKey });

  const [surface, setSurface] = useState(reading.surface_label || "");
  const [value, setValue] = useState(reading.reading_value ?? "");
  const [level, setLevel] = useState(reading.level || "normal");
  const [depth, setDepth] = useState(reading.depth_mm ?? "");
  const teId = reading.technician_equipment_id;

  useEffect(() => {
    setSurface(reading.surface_label || "");
    setValue(reading.reading_value ?? "");
    setLevel(reading.level || "normal");
    setDepth(reading.depth_mm ?? "");
  }, [reading.moisture_reading_id]);

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/moisture-readings/${reading.moisture_reading_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Delete → ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const fileRef = useRef(null);
  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Delete any existing evidence capture first — the
    //   UNIQUE (sample_location_id, pair_group, capture_kind)
    // index would otherwise reject the second INSERT and the UI would
    // silently keep showing the old photo. ON DELETE SET NULL on the FK
    // nulls moisture_readings.evidence_image_capture_id; the upload
    // below repopulates it.
    if (reading.evidence_image_capture_id) {
      await fetch(
        `/api/admin/image-captures/${reading.evidence_image_capture_id}`,
        { method: "DELETE" },
      ).catch(() => {});
    }

    const pair = 1000 + reading.moisture_reading_id;
    try {
      const json = await upload.upload({
        file,
        capture_kind: "moisture_evidence",
        pair_group: pair,
      });
      const newCaptureId = json?.row?.image_capture_id;
      if (newCaptureId) save.flushNow("evidence_image_capture_id", newCaptureId);
    } catch (_) {/* surfaced by upload.error */}
  }

  return (
    <article className={`wz-card ${focused ? "is-focused" : ""}`}>
      <header className="wz-card__head">
        <span className="wz-card__title">
          Reading #{index}
          {reading.marker_x_pct == null || reading.marker_y_pct == null ? (
            <em className="wz-card__warn"> · unpinned</em>
          ) : null}
        </span>
        <button
          type="button"
          className="wz-card__del"
          onClick={() => del.mutate()}
          disabled={del.isPending}
          aria-label="Delete reading"
        >×</button>
      </header>

      <div className="wz-card__body">
        <label className="wz-field">
          <span className="wz-field__label">Surface</span>
          <input
            type="text"
            className="wz-field__input"
            value={surface}
            onChange={(e) => { setSurface(e.target.value); save.set("surface_label", e.target.value); }}
            onBlur={() => save.flushNow("surface_label", surface)}
            placeholder="e.g. Wall — SE corner @ 1.2m"
          />
        </label>

        <div className="wz-grid">
          <label className="wz-field">
            <span className="wz-field__label">Reading (%MC)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="wz-field__input"
              value={value === null ? "" : value}
              onChange={(e) => {
                const v = e.target.value;
                setValue(v);
                save.set("reading_value", v === "" ? null : Number(v));
              }}
              onBlur={() => save.flushNow("reading_value", value === "" ? null : Number(value))}
            />
          </label>
          <label className="wz-field">
            <span className="wz-field__label">Level</span>
            <select
              className="wz-field__input"
              value={level}
              onChange={(e) => { setLevel(e.target.value); save.flushNow("level", e.target.value); }}
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        </div>

        <div className="wz-field">
          <span className="wz-field__label">Meter used</span>
          <EquipmentChipSelect
            kit={kit}
            selectedId={teId}
            onSelect={(id) => save.flushNow("technician_equipment_id", id)}
            emptyHint="No moisture meter in today's kit — add one from the inspection landing."
          />
        </div>

        <label className="wz-field">
          <span className="wz-field__label">Depth (mm)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            className="wz-field__input"
            value={depth === null ? "" : depth}
            onChange={(e) => {
              const v = e.target.value;
              setDepth(v);
              save.set("depth_mm", v === "" ? null : Number(v));
            }}
            onBlur={() => save.flushNow("depth_mm", depth === "" ? null : Number(depth))}
          />
        </label>

        <div className="wz-field">
          <span className="wz-field__label">Evidence photo</span>
          {(() => {
            const cap = reading.evidence_image_capture_id != null
              ? capturesById?.get(reading.evidence_image_capture_id)
              : null;
            const url = cap ? imageUrl(cap.storage_path) : null;
            return url ? (
              <img src={url} alt="Moisture reader in position" className="wz-card__thumb" />
            ) : (
              <p className="wz-card__hint">Take a photo of the meter on this surface.</p>
            );
          })()}
          <button
            type="button"
            className="ins-btn ins-btn--ghost"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? "Uploading…" : reading.evidence_image_capture_id ? "Re-take evidence" : "Capture evidence"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            hidden
          />
          {upload.isError ? (
            <p className="ins-error">{String(upload.error?.message || upload.error)}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ─── Reusable equipment chip select ──────────────────────────────────────
// Used inside Step 4 (moisture) and Step 5 (air sampler). One row in the
// kit array corresponds to one technician_equipment row, with a nested
// equipment_types record carrying name + image_storage_path.
export function EquipmentChipSelect({ kit, selectedId, onSelect, emptyHint }) {
  if (!kit || kit.length === 0) {
    return <p className="wz-card__hint">{emptyHint || "Nothing in today's kit for this step."}</p>;
  }
  return (
    <ul className="wz-eq-chips">
      {kit.map((k) => {
        // kit rows can arrive as either the raw technician_equipment row
        // (from /api/admin/technician-equipment) or wrapped by an
        // inspection_equipment row (with .technician_equipment nested).
        // Normalise both shapes here.
        const te = k.technician_equipment ? k.technician_equipment : k;
        const eq = te.equipment_types || {};
        const id = te.technician_equipment_id;
        const img = eq.image_storage_path ? `${SUPABASE_EQUIPMENT_BASE}${eq.image_storage_path}` : null;
        const isSelected = id === selectedId;
        return (
          <li key={id}>
            <button
              type="button"
              className={`wz-eq-chip ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelect(isSelected ? null : id)}
              aria-pressed={isSelected}
            >
              <div className="wz-eq-chip__img">
                {img ? <img src={img} alt="" /> : <span className="wz-eq-chip__icon">🛠</span>}
              </div>
              <div className="wz-eq-chip__name">{eq.name || `#${id}`}</div>
              {te.asset_tag ? <div className="wz-eq-chip__tag">{te.asset_tag}</div> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
