"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TIERS = ["normal", "low", "moderate", "high", "severe"];

// Step 8 — Finish room. Pick the overall mould pressure tier (the banding
// that drives the report's severity heuristics), then chain straight on:
// either spin up the next room or head to the whole-visit wrap-up. The
// whole-inspection wrap-up (scope of works + completion) is a separate page
// off the landing — "finish room" is per-location, "finish visit" is the visit.
export default function Step8Wrap({ row, save, inspectionId, stepNumber, onAddNextRoom, addingRoom, addRoomError }) {
  const [tier, setTier] = useState(row.mould_pressure_tier || "");
  useEffect(() => setTier(row.mould_pressure_tier || ""), [row.sample_location_id, row.mould_pressure_tier]);

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">{stepNumber} · Finish room</h2>
      <p className="wz-step__p">
        Pick the tier that reflects how loaded this room is, then move straight on — add the
        next room without bouncing through the inspection hub, or finish the whole visit.
      </p>

      <label className="wz-field">
        <span className="wz-field__label">Mould pressure tier</span>
        <select
          className="wz-field__input"
          value={tier}
          onChange={(e) => { setTier(e.target.value); save.flushNow("mould_pressure_tier", e.target.value || null); }}
        >
          <option value="">— select —</option>
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <div className="wz-terminal__actions">
        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block ins-btn--xl"
          onClick={onAddNextRoom}
          disabled={addingRoom}
        >
          {addingRoom ? "Creating…" : "Add next room →"}
        </button>
        <Link
          href={`/admin/inspections/${inspectionId}/wrap-up`}
          className="ins-btn ins-btn--primary ins-btn--block"
        >
          Finish visit →
        </Link>
        {addRoomError ? (
          <p className="ins-error">{String(addRoomError?.message || addRoomError)}</p>
        ) : null}
        <Link
          href={`/admin/inspections/${inspectionId}`}
          className="wz-terminal__ghost-link"
        >
          Back to inspection
        </Link>
      </div>
    </section>
  );
}
