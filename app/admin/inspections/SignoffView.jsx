"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Sign-off queue = the publish moment. Completed field work with a draft
// report, waiting on a qualified technician's decisive review. Oldest first
// so nothing rots at the back.
//
// Owner's philosophy: no approval-step ceremony. Each row expands into a
// review form (severity + executive summary); one primary action —
// "Sign off & publish report" — stamps the signer, writes the report
// narrative/severity, and flips report_status to published in a SINGLE
// PATCH. On success the row leaves the queue (the filter excludes signed
// rows) and a transient note links to the now-live /r2 report.
//
// Data (inspections + technicians) is fetched once at the Inspections page
// level and passed in as props.

const SIGNER_ROLES = new Set(["qualified", "admin"]);

// report_severity CHECK values from schema.sql.
const SEVERITIES = ["none", "low", "moderate", "high", "severe"];

export default function SignoffView({ rows, technicians, isLoading, isError, error }) {
  const queryClient = useQueryClient();

  const signers = (technicians ?? []).filter(
    (t) => t.active !== false && SIGNER_ROLES.has(t.role)
  );

  const [signerId, setSignerId] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [forms, setForms] = useState({}); // { [id]: { severity, summary } }
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState(null); // { id, message }
  const [success, setSuccess] = useState(null); // { name, slug }

  const queue = (rows ?? [])
    .filter((r) => r.report_status === "draft" && r.completed_at && !r.signed_off_at)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  function toggleRow(r) {
    const id = r.inspection_id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setRowError(null);
    // Seed the form once, prefilling from any existing draft report fields.
    setForms((f) =>
      f[id]
        ? f
        : {
            ...f,
            [id]: {
              severity: r.report_severity || "",
              summary: r.report_summary || "",
            },
          }
    );
  }

  function updateForm(id, patch) {
    setForms((f) => ({ ...f, [id]: { ...f[id], ...patch } }));
  }

  async function publish(r) {
    const id = r.inspection_id;
    const form = forms[id] || {};
    if (!signerId) {
      setRowError({ id, message: "Pick who's signing off first." });
      return;
    }
    if (!form.severity || !form.summary?.trim()) {
      setRowError({ id, message: "Pick a severity and write a summary first." });
      return;
    }
    setBusyId(id);
    setRowError(null);
    try {
      const now = new Date().toISOString();
      const res = await fetch(`/api/admin/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_summary: form.summary.trim(),
          report_severity: form.severity,
          signed_off_by_technician_id: Number(signerId),
          signed_off_at: now,
          report_status: "published",
          report_published_at: now,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Publish → ${res.status}`);
      }
      setSuccess({
        name: r.customers?.name || `Inspection #${id}`,
        slug: r.report_slug || null,
      });
      setExpandedId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-table", "inspections"] });
    } catch (err) {
      setRowError({ id, message: String(err.message || err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="insp-toolbar">
        <p className="insp-toolbar__note">
          Completed field work with a draft report — review, set severity &amp; summary, then sign
          off &amp; publish. Oldest first.
        </p>
        <label
          className="ins-muted"
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
        >
          Sign off as
          <select value={signerId} onChange={(e) => setSignerId(e.target.value)}>
            <option value="">Choose…</option>
            {signers.map((t) => (
              <option key={t.technician_id} value={String(t.technician_id)}>
                {t.name} ({t.role})
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="ins-error">{String(error?.message || error)}</p> : null}

      {!isLoading && !isError ? (
        <div className="insp-board">
          <section className="insp-col insp-col--wide">
            <div className="insp-col__head">
              <h2 className="insp-col__title insp-col__title--signoff">Awaiting sign-off</h2>
              <span className="insp-col__count">{queue.length}</span>
            </div>

            {success ? (
              <div className="signoff-success" role="status">
                <span>
                  Published <strong>{success.name}</strong>.
                </span>
                {success.slug ? (
                  <a href={`/r2/${success.slug}`} target="_blank" rel="noreferrer">
                    View live report →
                  </a>
                ) : null}
                <button
                  type="button"
                  className="signoff-success__dismiss"
                  aria-label="Dismiss"
                  onClick={() => setSuccess(null)}
                >
                  ✕
                </button>
              </div>
            ) : null}

            <ul className="insp-col__cards">
              {queue.length === 0 ? (
                <li className="ins-empty ins-empty--compact">Sign-off queue is clear.</li>
              ) : (
                queue.map((r) => {
                  const id = r.inspection_id;
                  const isExpanded = expandedId === id;
                  const form = forms[id] || { severity: "", summary: "" };
                  const isBusy = busyId === id;
                  const canPublish =
                    Boolean(signerId) && Boolean(form.severity) && Boolean(form.summary?.trim());
                  return (
                    <li key={id}>
                      <div className="insp-card insp-card--signoff insp-card--static">
                        <div className="insp-card__name">
                          <span>{r.customers?.name || "Unknown customer"}</span>
                        </div>
                        <div className="insp-card__badges">
                          <span className="insp-type-badge">{r.inspection_type}</span>
                          {r.report_severity ? (
                            <span className={`ins-badge ins-badge--sev-${r.report_severity}`}>
                              {r.report_severity}
                            </span>
                          ) : null}
                          <span className="ins-badge ins-badge--report-draft">draft</span>
                        </div>
                        <p className="insp-card__meta">
                          Completed {fmtWhen(r.completed_at)}
                          <br />
                          {r.properties?.address_line || "—"}
                          {r.properties?.postcode ? ` · ${r.properties.postcode}` : ""}
                          {" · "}
                          <span className="ins-muted">
                            field tech: {r.technician?.name || "unassigned"}
                          </span>
                        </p>

                        {isExpanded ? (
                          <div className="signoff-form">
                            <label className="signoff-form__field">
                              <span>Severity</span>
                              <select
                                value={form.severity}
                                onChange={(e) => updateForm(id, { severity: e.target.value })}
                              >
                                <option value="">Choose…</option>
                                {SEVERITIES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="signoff-form__field">
                              <span>Executive summary</span>
                              <textarea
                                rows={5}
                                value={form.summary}
                                placeholder="The reviewer narrative shown under the report title…"
                                onChange={(e) => updateForm(id, { summary: e.target.value })}
                              />
                            </label>
                          </div>
                        ) : null}

                        <div className="insp-card__actions">
                          <Link
                            href={`/admin/inspections/${id}`}
                            className="ins-section__edit"
                          >
                            Review →
                          </Link>
                          {isExpanded ? (
                            <button
                              type="button"
                              className="signoff-form__publish"
                              onClick={() => publish(r)}
                              disabled={isBusy || !canPublish}
                            >
                              {isBusy ? "Publishing…" : "Sign off & publish report"}
                            </button>
                          ) : (
                            <button type="button" onClick={() => toggleRow(r)}>
                              Review &amp; publish
                            </button>
                          )}
                          {isExpanded ? (
                            <button
                              type="button"
                              className="signoff-form__cancel"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>

                        {rowError?.id === id ? (
                          <p className="ins-error" style={{ margin: "6px 0 0" }}>
                            {rowError.message}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </>
  );
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
