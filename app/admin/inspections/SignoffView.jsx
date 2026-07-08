"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Sign-off queue — draft reports whose field work is complete, waiting on a
// qualified technician's review. Oldest first so nothing rots at the back.
// Rows open the inspection workspace for the actual review; the inline
// "Sign off" stamps signed_off_by_technician_id + signed_off_at once the
// reviewer is satisfied.
//
// Data (inspections + technicians) is fetched once at the Inspections page
// level and passed in as props. Rendered as a single "Awaiting sign-off"
// kanban column so it sits visually alongside the Pipeline / Today boards;
// tiles are static (not links) so the inline Sign off button can live in them.

const SIGNER_ROLES = new Set(["qualified", "admin"]);

export default function SignoffView({ rows, technicians, isLoading, isError, error }) {
  const queryClient = useQueryClient();

  const signers = (technicians ?? []).filter(
    (t) => t.active !== false && SIGNER_ROLES.has(t.role)
  );

  const [signerId, setSignerId] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState(null); // { id, message }

  const queue = (rows ?? [])
    .filter((r) => r.report_status === "draft" && r.completed_at && !r.signed_off_at)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  async function signOff(inspectionId) {
    if (!signerId) {
      setRowError({ id: inspectionId, message: "Pick who's signing off first." });
      return;
    }
    setBusyId(inspectionId);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed_off_by_technician_id: Number(signerId),
          signed_off_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Sign-off → ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-table", "inspections"] });
    } catch (err) {
      setRowError({ id: inspectionId, message: String(err.message || err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="insp-toolbar">
        <p className="insp-toolbar__note">
          Completed field work with a draft report — review, then sign off. Oldest first.
        </p>
        <label className="ins-muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
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
            <ul className="insp-col__cards">
              {queue.length === 0 ? (
                <li className="ins-empty ins-empty--compact">Sign-off queue is clear.</li>
              ) : (
                queue.map((r) => (
                  <li key={r.inspection_id}>
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
                        <span className="ins-muted">field tech: {r.technician?.name || "unassigned"}</span>
                      </p>
                      <div className="insp-card__actions">
                        <Link href={`/admin/inspections/${r.inspection_id}`} className="ins-section__edit">
                          Review →
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOff(r.inspection_id)}
                          disabled={busyId === r.inspection_id}
                        >
                          {busyId === r.inspection_id ? "Signing…" : "Sign off"}
                        </button>
                      </div>
                      {rowError?.id === r.inspection_id ? (
                        <p className="ins-error" style={{ margin: "6px 0 0" }}>{rowError.message}</p>
                      ) : null}
                    </div>
                  </li>
                ))
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
