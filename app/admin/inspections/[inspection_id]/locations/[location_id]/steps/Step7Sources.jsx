"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../../../lib/admin/useAutosaveRow";

const RANKS = ["primary", "secondary", "tertiary"];
const CATEGORIES = [
  "roof", "walls", "wet_area", "plumbing", "hvac",
  "ventilation", "drainage", "subfloor", "appliance",
  "condensation", "unknown",
];

// Step 8 — Ranked likely sources per location. The technician's hypothesis
// for what's causing the moisture pattern in this room.
export default function Step8Sources({ row, queryKey, locationId }) {
  const qc = useQueryClient();
  const sources = (row.location_sources || [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/location-sources", {
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
      <h2 className="wz-step__h">7 · Likely sources</h2>
      <p className="wz-step__p">
        What's causing this — ranked. Primary is the lead hypothesis; secondary / tertiary
        are alternates worth noting. The whole-inspection scope of works (next page) reads from this.
      </p>

      <ol className="wz-list">
        {sources.length === 0 ? (
          <li className="ins-empty">No sources noted yet.</li>
        ) : (
          sources.map((s) => (
            <li key={s.source_id}>
              <SourceCard source={s} queryKey={queryKey} />
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
        {add.isPending ? "Adding…" : "+ Add source"}
      </button>
      {add.isError ? <p className="ins-error">{String(add.error?.message || add.error)}</p> : null}
    </section>
  );
}

function SourceCard({ source, queryKey }) {
  const qc = useQueryClient();
  const save = useAutosaveRow({
    endpoint: `/api/admin/location-sources/${source.source_id}`,
    invalidate: queryKey,
  });
  const [rank, setRank] = useState(source.rank || "primary");
  const [category, setCategory] = useState(source.source_category || "unknown");
  const [desc, setDesc] = useState(source.description || "");

  useEffect(() => {
    setRank(source.rank || "primary");
    setCategory(source.source_category || "unknown");
    setDesc(source.description || "");
  }, [source.source_id]);

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/location-sources/${source.source_id}`, { method: "DELETE" });
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
        <span className="wz-card__title">Source #{source.source_id}</span>
        <button
          type="button"
          className="wz-card__del"
          onClick={() => del.mutate()}
          disabled={del.isPending}
          aria-label="Delete source"
        >×</button>
      </header>
      <div className="wz-card__body">
        <div className="wz-grid">
          <label className="wz-field">
            <span className="wz-field__label">Rank</span>
            <select
              className="wz-field__input"
              value={rank}
              onChange={(e) => { setRank(e.target.value); save.flushNow("rank", e.target.value); }}
            >
              {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="wz-field">
            <span className="wz-field__label">Category</span>
            <select
              className="wz-field__input"
              value={category}
              onChange={(e) => { setCategory(e.target.value); save.flushNow("source_category", e.target.value); }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </label>
        </div>
        <label className="wz-field">
          <span className="wz-field__label">Description</span>
          <textarea
            className="wz-field__input wz-field__textarea"
            rows={3}
            value={desc}
            onChange={(e) => { setDesc(e.target.value); save.set("description", e.target.value); }}
            onBlur={() => save.flushNow("description", desc)}
            placeholder="e.g. Cold-bridge condensation behind SE corner cavity — suspect under-insulated brick wall."
          />
        </label>
      </div>
    </article>
  );
}
