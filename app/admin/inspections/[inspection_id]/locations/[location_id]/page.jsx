"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../../lib/admin/useAutosaveRow";
import { useImageUpload, imageUrl } from "../../../../../../lib/admin/useImageUpload";
import Step4Moisture from "./steps/Step4Moisture";
import Step5AirSample from "./steps/Step5AirSample";
import Step6Findings from "./steps/Step6Findings";
import Step7Sources from "./steps/Step7Sources";
import Step8Wrap from "./steps/Step8Wrap";
import "../../inspection-workspace.css";
import "./wizard.css";

// ─────────────────────────────────────────────────────────────────────────
// Per-location wizard. SOP-guided: technician steps through 8 stages while
// every field debounce-saves to its underlying row. Step 4 is now pin-first
// — tapping the visible reference image creates a moisture_reading anchored
// at that point + scrolls to its expanded card. The old separate "Pin
// readings" step is gone.
//
// State sources:
//   - useQuery(location)  — per-location nested data (image_captures,
//     moisture_readings, location_findings, location_sources, air_sample).
//   - useQuery(inspection) — for the inspection_equipment kit, fed into
//     Steps 4 and 5 so the per-reading / per-sample chip select can render.
// ─────────────────────────────────────────────────────────────────────────

// All possible steps. Outdoor-control locations filter to a subset (just
// Identity + Visible + Air sample) since they don't have thermal/moisture
// pins, findings, sources or a mould pressure tier.
const ROOM_STEPS = [
  { key: 1, label: "Location" },
  { key: 2, label: "Visible" },
  { key: 3, label: "Thermal" },
  { key: 4, label: "Moisture" },
  { key: 5, label: "Air sample" },
  { key: 6, label: "Findings" },
  { key: 7, label: "Sources" },
  { key: 8, label: "Wrap" },
];
const OUTDOOR_STEPS = [
  { key: 1, label: "Setup" },
  { key: 2, label: "Visible" },
  { key: 5, label: "Air sample" },
];

export default function LocationWizardPage() {
  const params = useParams();
  const inspectionId = String(params?.inspection_id ?? "");
  const locationId = String(params?.location_id ?? "");
  const [step, setStep] = useState(1);

  const queryKey = useMemo(() => ["admin-location", locationId], [locationId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/sample-locations/${locationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Location ${locationId} → ${res.status}`);
      return res.json();
    },
    enabled: Boolean(locationId),
  });

  // The wizard also needs the parent inspection — specifically
  // inspection_equipment (the "today's kit" the tech checked off) so the
  // per-reading / per-sample chip selects can pull from the right list.
  const { data: inspectionData } = useQuery({
    queryKey: ["admin-inspection", inspectionId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Inspection ${inspectionId} → ${res.status}`);
      return res.json();
    },
    enabled: Boolean(inspectionId),
  });
  const kit = inspectionData?.row?.inspection_equipment ?? [];

  const save = useAutosaveRow({
    endpoint: `/api/admin/sample-locations/${locationId}`,
    invalidate: queryKey,
  });

  const upload = useImageUpload({
    inspectionId,
    sampleLocationId: locationId,
    invalidate: queryKey,
  });

  if (isLoading) {
    return <div className="ins-shell"><p className="ins-empty">Loading location…</p></div>;
  }
  if (isError) {
    return (
      <div className="ins-shell">
        <p className="ins-error">Couldn't load location: {String(error?.message || error)}</p>
        <Link href={`/admin/inspections/${inspectionId}`} className="ins-btn ins-btn--ghost">← Back to inspection</Link>
      </div>
    );
  }

  const row = data?.row;
  if (!row) {
    return (
      <div className="ins-shell">
        <p className="ins-empty">Location not found.</p>
        <Link href={`/admin/inspections/${inspectionId}`} className="ins-btn ins-btn--ghost">← Back to inspection</Link>
      </div>
    );
  }

  const captures = row.image_captures || [];
  const visible = captures.find((c) => c.capture_kind === "visible" && c.pair_group === 1);
  const thermal = captures.find((c) => c.capture_kind === "thermal" && c.pair_group === 1);

  // Outdoor-control locations skip thermal / moisture / findings / sources /
  // mould-pressure-tier — they only carry a wide visible reference shot and
  // the baseline air sample.
  const isOutdoor = Boolean(row.is_outdoor_control);
  const STEPS = isOutdoor ? OUTDOOR_STEPS : ROOM_STEPS;
  const stepKeys = STEPS.map((s) => s.key);
  const stepIndex = Math.max(0, stepKeys.indexOf(step));
  const onFirst = stepIndex === 0;
  const onLast = stepIndex === stepKeys.length - 1;

  // If somehow `step` falls outside the allowed set (e.g. coming from
  // localStorage of a previous run), snap it back into range.
  if (!stepKeys.includes(step)) {
    setTimeout(() => setStep(stepKeys[0]), 0);
  }

  return (
    <div className="wz">
      <header className="wz__header">
        <Link
          href={`/admin/inspections/${inspectionId}`}
          className="wz__back"
        >
          ← Back to inspection
        </Link>
        <div className="wz__title">
          <span className="wz__name">
            {row.name || "Untitled location"}
            {isOutdoor ? <span className="wz__name-tag">Outdoor control</span> : null}
          </span>
          <SaveIndicator status={save.status} lastSavedAt={save.lastSavedAt} />
        </div>
        <ol className="wz__steps">
          {STEPS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className={`wz__step ${step === s.key ? "is-active" : ""} ${s.key < step ? "is-done" : ""}`}
                onClick={() => setStep(s.key)}
                aria-label={`Step ${s.key}: ${s.label}`}
              >
                <span className="wz__step-num">{s.key}</span>
                <span className="wz__step-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <main className="wz__body">
        {step === 1 ? <Step1Identity row={row} save={save} /> : null}
        {step === 2 ? (
          <Step2Visible
            row={row}
            visible={visible}
            inspectionId={inspectionId}
            locationId={locationId}
            upload={upload}
          />
        ) : null}
        {step === 3 ? (
          <Step3Thermal
            row={row}
            thermal={thermal}
            visible={visible}
            save={save}
            upload={upload}
          />
        ) : null}
        {step === 4 ? (
          <Step4Moisture row={row} queryKey={queryKey} inspectionId={inspectionId} locationId={locationId} kit={kit} />
        ) : null}
        {step === 5 ? (
          <Step5AirSample row={row} queryKey={queryKey} inspectionId={inspectionId} locationId={locationId} kit={kit} />
        ) : null}
        {step === 6 ? (
          <Step6Findings row={row} queryKey={queryKey} locationId={locationId} />
        ) : null}
        {step === 7 ? (
          <Step7Sources row={row} queryKey={queryKey} locationId={locationId} />
        ) : null}
        {step === 8 ? (
          <Step8Wrap row={row} save={save} inspectionId={inspectionId} />
        ) : null}
      </main>

      <div className="wz__footer">
        <button
          type="button"
          className="ins-btn ins-btn--ghost"
          onClick={() => setStep(stepKeys[Math.max(0, stepIndex - 1)])}
          disabled={onFirst}
        >
          ← Back
        </button>
        <button
          type="button"
          className="ins-btn ins-btn--primary"
          onClick={() => setStep(stepKeys[Math.min(stepKeys.length - 1, stepIndex + 1)])}
          disabled={onLast}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — Identity (name + outdoor-control)
// ─────────────────────────────────────────────────────────────────────────
function Step1Identity({ row, save }) {
  const [name, setName] = useState(row.name || "");
  const isOutdoor = Boolean(row.is_outdoor_control);

  // Reconcile local state when the server row changes (e.g. landing-page
  // edits). We treat the server row as source of truth between focus
  // sessions.
  useEffect(() => {
    setName(row.name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.sample_location_id]);

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">1 · {isOutdoor ? "Outdoor control setup" : "Identify the location"}</h2>
      <p className="wz-step__p">
        {isOutdoor
          ? "This is the inspection's outdoor baseline. Only the wide visible shot and air sample steps apply — everything else is per-room."
          : <>Name what you're sampling (e.g. <em>Master bedroom — south wall</em>).</>}
      </p>

      <label className="wz-field">
        <span className="wz-field__label">Name</span>
        <input
          type="text"
          className="wz-field__input"
          inputMode="text"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save.set("name", e.target.value);
          }}
          onBlur={() => save.flushNow("name", name)}
          placeholder={isOutdoor ? "Outdoor control" : "e.g. Master bedroom — south wall"}
        />
      </label>

      {isOutdoor ? (
        <div className="wz-info">
          The outdoor flag was set when you tapped "Capture outdoor control" on the inspection landing.
          To turn this back into a regular room, delete it and re-create from the landing.
        </div>
      ) : null}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — Visible photo (wide aperture, cold-spot centred, ≥2m back)
// ─────────────────────────────────────────────────────────────────────────
function Step2Visible({ row, visible, inspectionId, locationId, upload }) {
  return (
    <section className="wz-step">
      <h2 className="wz-step__h">2 · Wide visible shot</h2>
      <p className="wz-step__p">
        Centre the cold spot in the frame, stand back at least 2 m (or as far as the room allows),
        and shoot wide. This becomes the canvas you'll pin moisture readings on later.
      </p>

      <PhotoSlot
        kind="visible"
        capture={visible}
        upload={upload}
        ctaLabel="Take visible photo"
        retakeLabel="Re-take visible"
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — Thermal photo + ΔT °C
// ─────────────────────────────────────────────────────────────────────────
function Step3Thermal({ row, thermal, visible, save, upload }) {
  const [delta, setDelta] = useState(row.thermal_delta_c ?? "");

  useEffect(() => {
    setDelta(row.thermal_delta_c ?? "");
  }, [row.sample_location_id, row.thermal_delta_c]);

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">3 · Thermal pair + ΔT</h2>
      <p className="wz-step__p">
        Take the matching thermal capture from the same position. Read the ΔT against the
        room reference (warmer ambient minus the cold spot) — this stores on the location row.
      </p>

      {visible ? (
        <div className="wz-pair">
          <figure className="wz-pair__half">
            <img src={imageUrl(visible.storage_path)} alt="Visible reference" />
            <figcaption>Visible reference</figcaption>
          </figure>
          <figure className={`wz-pair__half ${!thermal ? "wz-pair__half--ghost" : ""}`}>
            {thermal ? (
              <img src={imageUrl(thermal.storage_path)} alt="Thermal capture" />
            ) : (
              <div className="wz-pair__placeholder">Thermal pending</div>
            )}
            <figcaption>Thermal</figcaption>
          </figure>
        </div>
      ) : (
        <p className="ins-empty">Capture the visible shot in step 2 first.</p>
      )}

      <PhotoSlot
        kind="thermal"
        capture={thermal}
        upload={upload}
        ctaLabel="Take thermal photo"
        retakeLabel="Re-take thermal"
      />

      <label className="wz-field">
        <span className="wz-field__label">ΔT (°C)</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          className="wz-field__input"
          value={delta === null ? "" : delta}
          onChange={(e) => {
            const v = e.target.value;
            setDelta(v);
            save.set("thermal_delta_c", v === "" ? null : Number(v));
          }}
          onBlur={() => save.flushNow("thermal_delta_c", delta === "" ? null : Number(delta))}
          placeholder="e.g. 3.4"
        />
        <span className="wz-field__hint">Negative if the cold spot is colder than the room.</span>
      </label>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared photo slot. Camera input rolls through the platform camera on
// mobile (capture="environment"); on desktop it falls back to a file
// picker, which is useful when iterating in dev.
// ─────────────────────────────────────────────────────────────────────────
function PhotoSlot({ kind, capture, upload, ctaLabel, retakeLabel }) {
  const fileRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same filename later
    if (!file) return;
    setLocalError(null);

    // If there's already a capture in this slot, delete it first so the
    // unique (location, pair, kind) index doesn't collide.
    if (capture?.image_capture_id) {
      const del = await fetch(`/api/admin/image-captures/${capture.image_capture_id}`, { method: "DELETE" });
      if (!del.ok) {
        const j = await del.json().catch(() => ({}));
        setLocalError(j?.error || `Delete previous capture failed (${del.status})`);
        return;
      }
    }

    try {
      await upload.upload({ file, capture_kind: kind, pair_group: 1 });
    } catch (err) {
      setLocalError(String(err?.message || err));
    }
  }

  return (
    <div className="wz-photo">
      {capture ? (
        <div className="wz-photo__filled">
          <img
            src={imageUrl(capture.storage_path)}
            alt={`${kind} capture`}
            className="wz-photo__img"
          />
          <button
            type="button"
            className="ins-btn ins-btn--ghost"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? "Uploading…" : retakeLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="wz-photo__cta"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
        >
          <span className="wz-photo__cta-icon" aria-hidden>📷</span>
          <span className="wz-photo__cta-label">
            {upload.isPending ? "Uploading…" : ctaLabel}
          </span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />

      {localError ? <p className="ins-error">{localError}</p> : null}
      {upload.isError ? <p className="ins-error">{String(upload.error?.message || upload.error)}</p> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Save indicator — tiny status pill in the header so the technician can
// see autosave is alive without thinking about it.
// ─────────────────────────────────────────────────────────────────────────
function SaveIndicator({ status, lastSavedAt }) {
  if (status === "pending") return <span className="wz-save wz-save--pending">Saving…</span>;
  if (status === "error") return <span className="wz-save wz-save--error">Save failed</span>;
  if (lastSavedAt) return <span className="wz-save wz-save--ok">Saved</span>;
  return null;
}
