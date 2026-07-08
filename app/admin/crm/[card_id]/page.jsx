"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { STAGES } from "../../../../lib/crm/stages";
import "../crm.css";

/* Card workspace — the operator's single screen per customer:
   context panel (identity, tel:/mailto:, stage/snooze/auto controls, every
   lead with its full quiz text), touchpoint timeline, and the composer
   (call disposition logging, SMS/email drafts, notes). Sending drafts is
   Phase 3; until then SMS/email save as queue drafts. */

const DISPOSITIONS = [
  ["answered", "Answered"],
  ["voicemail", "Left voicemail"],
  ["no_answer", "No answer"],
  ["busy", "Busy"],
  ["callback_requested", "Callback requested"],
  ["wrong_number", "Wrong number"],
];

export default function CrmCardPage({ params }) {
  const { card_id } = use(params);
  const queryClient = useQueryClient();
  const queryKey = ["admin-crm-card", card_id];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/crm/cards/${card_id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Card → ${res.status}`);
      return res.json();
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  if (isLoading) return <p className="ins-empty">Loading…</p>;
  if (isError) return <p className="crm-error">{String(error?.message || error)}</p>;
  if (data?.error) return <p className="crm-error">{data.error}</p>;

  const { card, customer, leads, touchpoints, properties, inspections } = data;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{customer?.name ?? `Card ${card_id}`}</h1>
          <p>
            CRM card #{card.card_id} · in <strong>{card.stage}</strong> {daysIn(card.stage_changed_at)}
          </p>
        </div>
      </div>

      <div className="crm-work">
        <div>
          <ContextPanel
            card={card}
            customer={customer}
            properties={properties}
            inspections={inspections}
            onChanged={refresh}
          />
          <section className="crm-panel">
            <h2>Enquiries ({leads.length})</h2>
            {leads.map((lead) => (
              <article className="crm-lead-event" key={lead.lead_id}>
                <div className="crm-lead-event__meta">
                  <span>{fmtWhen(lead.submitted_at)}</span>
                  <span className={`crm-chip crm-chip--${lead.audience}`}>{lead.audience}</span>
                  <span>{lead.form ?? "form"}</span>
                  <span>{lead.landing_page ?? ""}</span>
                  {lead.utm_source ? <span>via {lead.utm_source}</span> : <span>untracked</span>}
                </div>
                <p className="crm-lead-event__msg">{lead.message || "(no message)"}</p>
              </article>
            ))}
          </section>
        </div>

        <div>
          <Composer cardId={card.card_id} customer={customer} onSaved={refresh} />
          <section className="crm-panel">
            <h2>Timeline ({touchpoints.length})</h2>
            {touchpoints.length === 0 ? (
              <p className="ins-empty ins-empty--compact">No touchpoints yet.</p>
            ) : (
              <ul className="crm-timeline">
                {touchpoints.map((tp) => (
                  <TimelineItem key={tp.touchpoint_id} tp={tp} onChanged={refresh} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Context panel ─────────────────────────────────────────────────────── */

function ContextPanel({ card, customer, properties, inspections, onChanged }) {
  const [busy, setBusy] = useState(false);

  async function patchCard(patch) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/crm-cards/${card.card_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Update → ${res.status}`);
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  const telHref = customer?.phone ? `tel:${customer.phone.replace(/\s+/g, "")}` : null;

  return (
    <section className="crm-panel">
      <h2>Customer</h2>
      <p className="crm-identity__name">{customer?.name ?? "Unknown"}</p>
      <div className="crm-identity__row">
        <span className="crm-identity__label">Phone</span>
        {telHref ? <a href={telHref}>{customer.phone}</a> : <span>—</span>}
      </div>
      <div className="crm-identity__row">
        <span className="crm-identity__label">Email</span>
        {customer?.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : <span>—</span>}
      </div>
      <div className="crm-identity__row">
        <span className="crm-identity__label">Address</span>
        <span>
          {customer?.address_line ?? "—"}
          {customer?.postcode ? ` · ${customer.postcode}` : ""}
        </span>
      </div>
      {properties.length > 0 ? (
        <div className="crm-identity__row">
          <span className="crm-identity__label">Props</span>
          <span>
            {properties.map((p) => `${p.address_line} (${p.relationship})`).join(" · ")}
          </span>
        </div>
      ) : null}
      {inspections.length > 0 ? (
        <div className="crm-identity__row">
          <span className="crm-identity__label">Inspect</span>
          <span>
            {inspections
              .map((i) => `#${i.inspection_id} ${i.status} ${i.scheduled_at ? fmtWhen(i.scheduled_at) : ""}`)
              .join(" · ")}
          </span>
        </div>
      ) : null}

      <div className="crm-controls" style={{ marginTop: 14 }}>
        <div>
          <label htmlFor="crm-stage">Stage</label>
          <select
            id="crm-stage"
            value={card.stage}
            disabled={busy}
            onChange={(e) => void patchCard({ stage: e.target.value })}
          >
            {STAGES.map((s) => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="crm-snooze">Snooze until</label>
          <input
            id="crm-snooze"
            type="datetime-local"
            defaultValue={card.snoozed_until ? toLocalInput(card.snoozed_until) : ""}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value;
              const iso = v ? new Date(v).toISOString() : null;
              if ((card.snoozed_until ?? null) !== iso) void patchCard({ snoozed_until: iso });
            }}
          />
        </div>
        <label className="crm-toggle">
          <input
            type="checkbox"
            checked={Boolean(card.auto_mode)}
            disabled={busy}
            onChange={(e) => void patchCard({ auto_mode: e.target.checked })}
          />
          Auto mode — AI-suggested SMS/email send without approval
        </label>
      </div>
    </section>
  );
}

/* ── Composer ──────────────────────────────────────────────────────────── */

function Composer({ cardId, customer, onSaved }) {
  const [tab, setTab] = useState("call");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [disposition, setDisposition] = useState("no_answer");
  const [callNotes, setCallNotes] = useState("");

  async function save(payload, reset) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Save → ${res.status}`);
      reset?.();
      onSaved();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const telHref = customer?.phone ? `tel:${customer.phone.replace(/\s+/g, "")}` : null;

  return (
    <section className="crm-panel">
      <h2>Log / compose</h2>
      <div className="crm-composer__tabs" role="tablist">
        {["call", "sms", "email", "note"].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`crm-composer__tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "call" ? (
        <div className="crm-composer__form">
          <div className="crm-composer__row">
            {telHref ? (
              <a className="crm-btn crm-btn--call" href={telHref}>Call {customer?.phone}</a>
            ) : (
              <p className="crm-note">No phone on file.</p>
            )}
          </div>
          <div>
            <label className="crm-note" htmlFor="crm-dispo">Outcome</label>
            <select id="crm-dispo" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
              {DISPOSITIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            placeholder="What happened / what they said…"
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
          />
          <div className="crm-composer__row">
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() =>
                save(
                  { channel: "call", status: "logged", disposition, outcome_notes: callNotes },
                  () => setCallNotes(""),
                )
              }
            >
              Log call
            </button>
          </div>
        </div>
      ) : null}

      {tab === "sms" ? (
        <div className="crm-composer__form">
          <textarea
            rows={4}
            placeholder="SMS body…"
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
          />
          <div className="crm-composer__row">
            <button
              type="button"
              className="crm-btn"
              disabled={busy || !smsBody.trim() || !customer?.phone}
              onClick={() =>
                save(
                  { channel: "sms", status: "draft", body: smsBody, to_address: customer?.phone ?? null },
                  () => setSmsBody(""),
                )
              }
            >
              Save draft
            </button>
            <span className="crm-composer__count">{smsBody.length} chars{smsBody.length > 160 ? ` · ${Math.ceil(smsBody.length / 153)} segments` : ""}</span>
          </div>
          {!customer?.phone ? <p className="crm-note">No phone on file — SMS unavailable.</p> : null}
        </div>
      ) : null}

      {tab === "email" ? (
        <div className="crm-composer__form">
          <input
            type="text"
            placeholder="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
          <textarea
            rows={8}
            placeholder="Email body…"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />
          <div className="crm-composer__row">
            <button
              type="button"
              className="crm-btn"
              disabled={busy || !emailBody.trim() || !emailSubject.trim() || !customer?.email}
              onClick={() =>
                save(
                  {
                    channel: "email",
                    status: "draft",
                    subject: emailSubject,
                    body: emailBody,
                    to_address: customer?.email ?? null,
                  },
                  () => {
                    setEmailSubject("");
                    setEmailBody("");
                  },
                )
              }
            >
              Save draft
            </button>
          </div>
        </div>
      ) : null}

      {tab === "note" ? (
        <div className="crm-composer__form">
          <textarea
            rows={3}
            placeholder="Internal note…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <div className="crm-composer__row">
            <button
              type="button"
              className="crm-btn"
              disabled={busy || !noteBody.trim()}
              onClick={() => save({ channel: "note", status: "logged", body: noteBody }, () => setNoteBody(""))}
            >
              Add note
            </button>
          </div>
        </div>
      ) : null}

      {err ? <p className="crm-error">{err}</p> : null}
    </section>
  );
}

/* ── Timeline ──────────────────────────────────────────────────────────── */

function TimelineItem({ tp, onChanged }) {
  const [busy, setBusy] = useState(false);

  async function patch(patchBody) {
    setBusy(true);
    try {
      await fetch(`/api/admin/touchpoints/${tp.touchpoint_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  const liClass = tp.origin === "ai" ? "tl--ai" : `tl--${tp.channel}`;
  const pending = ["draft", "approved"].includes(tp.status);

  return (
    <li className={liClass}>
      <div className="crm-tl__head">
        <span className="crm-tl__channel">{tp.channel}</span>
        {tp.direction === "inbound" ? <span>inbound</span> : null}
        <span className={`crm-badge crm-badge--${tp.status}`}>{tp.status}</span>
        {tp.origin === "ai" ? <span className="crm-badge crm-badge--draft">AI</span> : null}
        {tp.disposition ? <span>{tp.disposition.replace(/_/g, " ")}</span> : null}
        <span>{fmtWhen(tp.created_at)}</span>
        {tp.schedule_at && pending ? <span>due {fmtWhen(tp.schedule_at)}</span> : null}
      </div>
      {tp.subject ? <p className="crm-tl__body crm-tl__subject">{tp.subject}</p> : null}
      {tp.body ? (
        <p className={`crm-tl__body${tp.channel === "system" ? " crm-tl__body--muted" : ""}`}>{tp.body}</p>
      ) : null}
      {tp.outcome_notes ? <p className="crm-tl__body crm-tl__body--muted">↳ {tp.outcome_notes}</p> : null}
      {tp.ai_reasoning ? <p className="crm-tl__body crm-tl__body--muted">AI: {tp.ai_reasoning}</p> : null}
      {tp.error ? <p className="crm-error">{tp.error}</p> : null}
      {pending ? (
        <div className="crm-tl__actions">
          {tp.status === "draft" ? (
            <button type="button" className="crm-btn crm-btn--ghost" disabled={busy} onClick={() => patch({ status: "approved" })}>
              Approve
            </button>
          ) : null}
          <button type="button" className="crm-btn crm-btn--danger" disabled={busy} onClick={() => patch({ status: "cancelled" })}>
            Dismiss
          </button>
        </div>
      ) : null}
    </li>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function daysIn(iso) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "since today";
  return `for ${days}d`;
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
