"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../../../lib/admin/useAutosaveRow";
import { useImageUpload, imageUrl } from "../../../../../../../lib/admin/useImageUpload";
import { decodeBarcode } from "../../../../../../../lib/admin/decodeBarcode";
import { EquipmentChipSelect } from "./Step4Moisture";

// Step 5 — Air sample.
//
// One air_sample per sample_location (UNIQUE on sample_location_id in the
// schema). The first time the technician enters this step it's a "+ Begin"
// CTA; once created, the row's fields debounce-save like everywhere else.
//
// The intake-time evidence photo (canister with ID legible while the pump
// is running) is the field-side companion to the slide images the lab
// returns later.
export default function Step5AirSample({ row, queryKey, inspectionId, locationId, kit }) {
  const qc = useQueryClient();
  // PostgREST collapses to-one embeds (UNIQUE FK) to a single object,
  // not an array. Normalise both shapes here so we don't care upstream.
  const air = normaliseToOne(row.air_samples);
  const samplerKit = (kit || []).filter(
    (k) => (k.technician_equipment?.equipment_types?.category || k.equipment_types?.category) === "air_sampler",
  );

  // Same lookup trick as Step 4 — index image_captures by id so the editor
  // can render the intake-evidence thumbnail in O(1).
  const capturesById = useMemo(
    () => new Map((row.image_captures || []).map((c) => [c.image_capture_id, c])),
    [row.image_captures],
  );

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/air-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_location_id: Number(locationId) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  if (!air) {
    return (
      <section className="wz-step">
        <h2 className="wz-step__h">5 · Air sample</h2>
        <p className="wz-step__p">
          One sample per location, on a lab-issued slide. Document the canister ID and take an
          evidence photo while it's intaking — slide images attach later when the lab returns.
        </p>
        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block"
          onClick={() => create.mutate()}
          disabled={create.isPending}
        >
          {create.isPending ? "Starting…" : "+ Begin air sample"}
        </button>
        {create.isError ? (
          <p className="ins-error">{String(create.error?.message || create.error)}</p>
        ) : null}
      </section>
    );
  }

  return (
    <AirSampleEditor
      air={air}
      queryKey={queryKey}
      inspectionId={inspectionId}
      locationId={locationId}
      samplerKit={samplerKit}
      capturesById={capturesById}
    />
  );
}

function AirSampleEditor({ air, queryKey, inspectionId, locationId, samplerKit, capturesById }) {
  const save = useAutosaveRow({
    endpoint: `/api/admin/air-samples/${air.air_sample_id}`,
    invalidate: queryKey,
  });
  const upload = useImageUpload({ inspectionId, sampleLocationId: locationId, invalidate: queryKey });
  const fileRef = useRef(null);

  const [labSampleId, setLabSampleId] = useState(air.lab_sample_id || "");
  const [sampledAt, setSampledAt] = useState(
    air.sampled_at ? toLocalDateTimeInput(air.sampled_at) : "",
  );
  const [labNotes, setLabNotes] = useState(air.lab_notes || "");

  // Local-only state: did the most recent photo decode a barcode that
  // auto-filled lab_sample_id? Shown as a small confirmation chip so the
  // tech knows the value isn't theirs to second-guess (but can still edit).
  const [decodedHint, setDecodedHint] = useState(null);
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    setLabSampleId(air.lab_sample_id || "");
    setSampledAt(air.sampled_at ? toLocalDateTimeInput(air.sampled_at) : "");
    setLabNotes(air.lab_notes || "");
  }, [air.air_sample_id]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Try to decode a barcode out of the same photo. Runs in parallel with
    // the upload so the user doesn't wait on it.
    setDecoding(true);
    const decodePromise = decodeBarcode(file).finally(() => setDecoding(false));

    // If there's already an intake capture, delete it FIRST. Otherwise the
    // INSERT on the new capture trips the
    //   UNIQUE (sample_location_id, pair_group, capture_kind)
    // index and we silently keep the old image. ON DELETE SET NULL on the
    // FK nulls air_samples.intake_evidence_image_capture_id when the old
    // row is removed; the upload below repopulates it.
    if (air.intake_evidence_image_capture_id) {
      await fetch(
        `/api/admin/image-captures/${air.intake_evidence_image_capture_id}`,
        { method: "DELETE" },
      ).catch(() => {});
    }

    // High pair_group so it doesn't clash with visible/thermal pair 1.
    const pair = 2000 + air.air_sample_id;
    try {
      const json = await upload.upload({
        file,
        capture_kind: "air_evidence",
        pair_group: pair,
      });
      const newCaptureId = json?.row?.image_capture_id;
      if (newCaptureId) {
        save.flushNow("intake_evidence_image_capture_id", newCaptureId);
      }
    } catch (_) {/* surfaced by upload.error */}

    // Apply the decoded barcode after upload finishes — but only if the
    // field is still empty. We don't want to clobber a value the tech
    // typed manually (or one already there from an earlier capture).
    const detected = await decodePromise;
    if (detected) {
      // Read the CURRENT value off the row (server state), not stale
      // closure, in case the field was edited mid-upload.
      const current = (air.lab_sample_id || labSampleId || "").trim();
      if (!current) {
        setLabSampleId(detected);
        setDecodedHint(detected);
        save.flushNow("lab_sample_id", detected);
      } else if (current !== detected) {
        // Surface a passive note so the tech can swap manually if their
        // typed value disagrees with the scan.
        setDecodedHint(`differs from current — barcode read ${detected}`);
      }
    }
  }

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">5 · Air sample</h2>
      <p className="wz-step__p">Lab-issued slide. Read the canister ID off the label and enter it below.</p>

      <div className="wz-field">
        <span className="wz-field__label">Pump / sampler used</span>
        <EquipmentChipSelect
          kit={samplerKit}
          selectedId={air.technician_equipment_id}
          onSelect={(id) => save.flushNow("technician_equipment_id", id)}
          emptyHint="No air sampler in today's kit — add one from the inspection landing."
        />
      </div>

      <label className="wz-field">
        <span className="wz-field__label">Canister / lab sample ID</span>
        <input
          type="text"
          className="wz-field__input"
          value={labSampleId}
          onChange={(e) => {
            setLabSampleId(e.target.value);
            save.set("lab_sample_id", e.target.value);
            // Any manual edit clears the "auto-filled from photo" hint.
            if (decodedHint) setDecodedHint(null);
          }}
          onBlur={() => save.flushNow("lab_sample_id", labSampleId)}
          placeholder="e.g. SC-04210-A (or scan barcode)"
        />
        <span className="wz-field__hint">
          {decoding
            ? "Reading barcode…"
            : decodedHint
              ? <>✓ Auto-filled from intake photo · edit if wrong</>
              : "Type manually or capture an intake photo with the barcode visible."}
        </span>
      </label>

      <label className="wz-field">
        <span className="wz-field__label">Sampled at</span>
        <input
          type="datetime-local"
          className="wz-field__input"
          value={sampledAt}
          onChange={(e) => {
            setSampledAt(e.target.value);
            const iso = fromLocalDateTimeInput(e.target.value);
            save.flushNow("sampled_at", iso);
          }}
        />
      </label>

      <div className="wz-field">
        <span className="wz-field__label">Intake evidence photo</span>
        {(() => {
          const cap = air.intake_evidence_image_capture_id != null
            ? capturesById?.get(air.intake_evidence_image_capture_id)
            : null;
          const url = cap ? imageUrl(cap.storage_path) : null;
          return url ? (
            <img src={url} alt="Air sampler intaking" className="wz-card__thumb" />
          ) : (
            <p className="wz-card__hint">
              Frame the canister with the barcode visible — we'll auto-read the ID into the field above.
            </p>
          );
        })()}
        <button
          type="button"
          className="ins-btn ins-btn--ghost"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending
            ? "Uploading…"
            : decoding
              ? "Reading barcode…"
              : air.intake_evidence_image_capture_id
                ? "Replace intake photo"
                : "Take or upload intake photo"}
        </button>
        {/* No `capture` attribute — lets iOS / Android show the standard
            picker (Take Photo · Photo Library · Browse) so the tech can
            shoot fresh or pick an existing image. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          hidden
        />
        {upload.isError ? (
          <p className="ins-error">{String(upload.error?.message || upload.error)}</p>
        ) : null}
      </div>

      <label className="wz-field">
        <span className="wz-field__label">Field notes (optional)</span>
        <textarea
          className="wz-field__input wz-field__textarea"
          rows={3}
          value={labNotes}
          onChange={(e) => { setLabNotes(e.target.value); save.set("lab_notes", e.target.value); }}
          onBlur={() => save.flushNow("lab_notes", labNotes)}
          placeholder="Anything unusual about this sample (e.g. pump fault, intake interruption)…"
        />
      </label>
    </section>
  );
}

// Treat as a single embedded row whether PostgREST collapsed it to an
// object (UNIQUE FK) or returned it as a one-element array.
function normaliseToOne(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  if (typeof v === "object") return v;
  return null;
}

// <input type="datetime-local"> wants a naïve local string with no offset.
// We convert to/from ISO at the API boundary.
function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDateTimeInput(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
