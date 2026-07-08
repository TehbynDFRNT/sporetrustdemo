"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CallButton from "../../../components/admin/CallButton";

const DISPOSITIONS = [
  ["answered", "Answered"],
  ["voicemail", "Left voicemail"],
  ["no_answer", "No answer"],
  ["busy", "Busy"],
  ["callback_requested", "Callback requested"],
  ["wrong_number", "Wrong number"],
];

export const QUEUE_QUERY_KEY = ["admin-crm-queue"];

/* Action queue view — every pending touchpoint across every card, bucketed by
   what it needs: approval (drafts), due now (approved, due or unscheduled),
   scheduled (approved, future), recent failures. Inline approve/send/dismiss
   so a whole morning's follow-ups can be worked from one screen. Rendered
   inside the CRM page's "Actions" tab; the /queue route redirects here.

   Data is fetched once at page level (queryKey ["admin-crm-queue"]) and passed
   down so the tab badge and the view share a single request. */

export default function ActionsView({ data, isLoading, isError, error }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });

  const pending = data?.pending ?? [];
  const failed = data?.failed ?? [];
  const now = new Date().toISOString();

  const needsApproval = pending.filter((t) => t.status === "draft");
  const dueNow = pending.filter(
    (t) => t.status === "approved" && (!t.schedule_at || t.schedule_at <= now),
  );
  const scheduled = pending.filter((t) => t.status === "approved" && t.schedule_at > now);

  return (
    <>
      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="crm-error">{String(error?.message || error)}</p> : null}
      {data?.error ? <p className="crm-error">{data.error}</p> : null}

      <QueueBucket title="Needs approval" hint="Drafts waiting on a human decision." rows={needsApproval} onChanged={refresh} tone="draft" />
      <QueueBucket title="Due now" hint="Approved and ready to fire." rows={dueNow} onChanged={refresh} tone="due" />
      <QueueBucket title="Scheduled" hint="Approved, waiting for their send window." rows={scheduled} onChanged={refresh} />
      <QueueBucket title="Recent failures" hint="Failed sends from the last 7 days — retry or dismiss." rows={failed} onChanged={refresh} tone="failed" />
    </>
  );
}

function QueueBucket({ title, hint, rows, onChanged, tone }) {
  return (
    <section className="crm-panel" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>{title}</h2>
        <span className="crm-lane__count">{rows.length}</span>
      </div>
      <p className="crm-note" style={{ marginTop: -6, marginBottom: 10 }}>{hint}</p>
      {rows.length === 0 ? (
        <p className="ins-empty ins-empty--compact">Nothing here.</p>
      ) : (
        <ul className="crm-timeline">
          {rows.map((tp) => (
            <QueueItem key={tp.touchpoint_id} tp={tp} onChanged={onChanged} tone={tone} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueItem({ tp, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [disposition, setDisposition] = useState("");
  // Local edit buffers for editable drafts (sms/email body + email subject).
  const [body, setBody] = useState(tp.body ?? "");
  const [subject, setSubject] = useState(tp.subject ?? "");
  const customer = tp.crm_cards?.customers ?? {};
  const sendable = ["sms", "email"].includes(tp.channel);
  const isCall = tp.channel === "call";
  const isStageMove = tp.template_key?.startsWith("stage:");
  const pending = ["draft", "approved"].includes(tp.status);
  const phone = tp.to_address || customer.phone || null;
  const target = tp.channel === "email" ? tp.to_address || customer.email : phone;
  // Drafts on sms/email are editable inline so rule-generated empty drafts
  // can be filled in and fired without opening the card workspace.
  const editable = sendable && tp.status === "draft";

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

  // Save-on-blur: only PATCH when the field actually changed, so tabbing
  // through an untouched draft doesn't spam the API or trigger a refetch.
  async function saveBody() {
    if (body === (tp.body ?? "")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/touchpoints/${tp.touchpoint_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  async function saveSubject() {
    if (subject === (tp.subject ?? "")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/touchpoints/${tp.touchpoint_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  async function sendNow() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/touchpoints/${tp.touchpoint_id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Send → ${res.status}`);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  async function logCall() {
    if (!disposition) {
      setErr("Pick a call outcome first.");
      return;
    }
    setErr("");
    await patch({ status: "logged", disposition });
  }

  async function applyStageMove() {
    const stage = tp.template_key.slice("stage:".length);
    setBusy(true);
    setErr("");
    try {
      await fetch(`/api/admin/crm-cards/${tp.card_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      await fetch(`/api/admin/touchpoints/${tp.touchpoint_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "logged" }),
      });
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  return (
    <li className={tp.origin === "ai" ? "tl--ai" : `tl--${tp.channel}`}>
      <div className="crm-tl__head">
        <Link href={`/admin/crm/${tp.card_id}`} style={{ fontWeight: 650 }}>
          {customer.name ?? `Card ${tp.card_id}`}
        </Link>
        <span className="crm-tl__channel">{tp.channel}</span>
        <span className={`crm-badge crm-badge--${tp.status}`}>{tp.status}</span>
        {tp.origin === "ai" ? <span className="crm-badge crm-badge--draft">AI</span> : null}
        {tp.schedule_at ? <span>due {fmtWhen(tp.schedule_at)}</span> : null}
        {target ? <span className="crm-note">→ {target}</span> : null}
      </div>

      {editable ? (
        <div className="crm-queue-edit">
          {tp.channel === "email" ? (
            <input
              type="text"
              className="crm-queue-edit__subject"
              placeholder="Subject…"
              value={subject}
              disabled={busy}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => void saveSubject()}
            />
          ) : null}
          <textarea
            className="crm-queue-edit__body"
            rows={3}
            placeholder={tp.channel === "sms" ? "SMS body…" : "Email body…"}
            value={body}
            disabled={busy}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => void saveBody()}
          />
          {tp.channel === "sms" ? (
            <span className="crm-composer__count">
              {body.length} chars{body.length > 160 ? ` · ${Math.ceil(body.length / 153)} segments` : ""}
            </span>
          ) : null}
        </div>
      ) : (
        <>
          {tp.subject ? <p className="crm-tl__body crm-tl__subject">{tp.subject}</p> : null}
          {tp.body ? <p className="crm-tl__body">{tp.body}</p> : null}
        </>
      )}

      {tp.ai_reasoning ? <p className="crm-tl__body crm-tl__body--muted">AI: {tp.ai_reasoning}</p> : null}
      {tp.error ? <p className="crm-error">{tp.error}</p> : null}
      <div className="crm-tl__actions">
        {isCall && pending ? (
          <>
            <CallButton phone={phone} />
            <select
              value={disposition}
              disabled={busy}
              onChange={(e) => setDisposition(e.target.value)}
              aria-label="Call outcome"
            >
              <option value="">Outcome…</option>
              {DISPOSITIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="button" className="crm-btn" disabled={busy || !disposition} onClick={() => void logCall()}>
              {busy ? "Logging…" : "Log outcome"}
            </button>
          </>
        ) : null}
        {isStageMove && pending ? (
          <button type="button" className="crm-btn" disabled={busy} onClick={() => void applyStageMove()}>
            {busy ? "Applying…" : "Apply move"}
          </button>
        ) : null}
        {sendable && pending ? (
          <button type="button" className="crm-btn" disabled={busy} onClick={() => void sendNow()}>
            {busy ? "Sending…" : tp.channel === "sms" ? "Send SMS now" : "Send email now"}
          </button>
        ) : null}
        {tp.status === "draft" && sendable ? (
          <button type="button" className="crm-btn crm-btn--ghost" disabled={busy} onClick={() => patch({ status: "approved" })}>
            Approve (scheduled)
          </button>
        ) : null}
        {tp.status === "failed" ? (
          <button type="button" className="crm-btn crm-btn--ghost" disabled={busy} onClick={() => patch({ status: "approved" })}>
            Retry
          </button>
        ) : null}
        {pending ? (
          <button type="button" className="crm-btn crm-btn--danger" disabled={busy} onClick={() => patch({ status: "cancelled" })}>
            Dismiss
          </button>
        ) : null}
      </div>
      {err ? <p className="crm-error">{err}</p> : null}
    </li>
  );
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
