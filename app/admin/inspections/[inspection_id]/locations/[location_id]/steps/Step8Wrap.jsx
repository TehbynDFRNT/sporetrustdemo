"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TIERS = ["normal", "low", "moderate", "high", "severe"];

// Step 9 — Wrap this location. Pick the overall mould pressure tier (the
// banding that drives the report's severity heuristics) and return to the
// inspection landing. The whole-inspection wrap-up (scope of works +
// completion) is a separate page off the landing.
export default function Step9Wrap({ row, save, inspectionId }) {
  const [tier, setTier] = useState(row.mould_pressure_tier || "");
  useEffect(() => setTier(row.mould_pressure_tier || ""), [row.sample_location_id, row.mould_pressure_tier]);

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">8 · Wrap this location</h2>
      <p className="wz-step__p">
        Pick the tier that reflects how loaded this room is, then head back to the inspection
        to either start another location or wrap up the visit.
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

      <Link
        href={`/admin/inspections/${inspectionId}`}
        className="ins-btn ins-btn--primary ins-btn--block"
      >
        Back to inspection
      </Link>
    </section>
  );
}
