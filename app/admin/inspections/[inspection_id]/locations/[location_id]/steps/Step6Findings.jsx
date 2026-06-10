"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../../../lib/admin/useAutosaveRow";

// Step 7 — Narrative findings per location. Usually one entry, but the
// schema allows multiple ordered observations (e.g. "morning visible
// staining" plus "afternoon thermal anomaly").
export default function Step7Findings({ row, queryKey, locationId }) {
  const qc = useQueryClient();
  const findings = (row.location_findings || [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/location-findings", {
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

  return (
    <section className="wz-step">
      <h2 className="wz-step__h">6 · Findings</h2>
      <p className="wz-step__p">
        Plain-English observation per location. This is what carries through to the report's narrative
        section — "what did the technician actually see".
      </p>

      <ol className="wz-list">
        {findings.length === 0 ? (
          <li className="ins-empty">No findings yet.</li>
        ) : (
          findings.map((f) => (
            <li key={f.finding_id}>
              <FindingCard finding={f} queryKey={queryKey} />
            </li>
          ))
        )}
      </ol>

      <button
        type="button"
        className="ins-btn ins-btn--primary ins-btn--block"
        onClick={() => add.mutate()}
        disabled={add.isPending}
      >
        {add.isPending ? "Adding…" : "+ Add observation"}
      </button>
      {add.isError ? <p className="ins-error">{String(add.error?.message || add.error)}</p> : null}
    </section>
  );
}

function FindingCard({ finding, queryKey }) {
  const qc = useQueryClient();
  const save = useAutosaveRow({
    endpoint: `/api/admin/location-findings/${finding.finding_id}`,
    invalidate: queryKey,
  });
  const [text, setText] = useState(finding.observation || "");
  useEffect(() => setText(finding.observation || ""), [finding.finding_id]);

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/location-findings/${finding.finding_id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Delete → ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return (
    <article className="wz-card">
      <header className="wz-card__head">
        <span className="wz-card__title">Observation #{finding.finding_id}</span>
        <button
          type="button"
          className="wz-card__del"
          onClick={() => del.mutate()}
          disabled={del.isPending}
          aria-label="Delete observation"
        >×</button>
      </header>
      <div className="wz-card__body">
        <textarea
          className="wz-field__input wz-field__textarea"
          rows={5}
          value={text}
          onChange={(e) => { setText(e.target.value); save.set("observation", e.target.value); }}
          onBlur={() => save.flushNow("observation", text)}
          placeholder="e.g. Localised moisture concentration at SE wall corner, ~1.2m above floor…"
        />
      </div>
    </article>
  );
}
