"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { STAGES } from "../../../lib/crm/stages";
import "./crm.css";

// Kanban board — one lane per stage (lib/crm/stages.js), one card per
// customer. Native HTML5 drag-drop, no deps: dataTransfer carries the
// card_id (readable only in drop), lanes preventDefault on dragover or the
// drop never fires, and the touch fallback is the stage <select> on the
// card workspace page.
export default function CrmBoardPage() {
  const queryClient = useQueryClient();
  const [dragOverLane, setDragOverLane] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-crm-board"],
    queryFn: async () => {
      const res = await fetch("/api/admin/crm/board", { cache: "no-store" });
      if (!res.ok) throw new Error(`Board → ${res.status}`);
      return res.json();
    },
  });

  const rows = data?.rows ?? [];

  async function moveCard(cardId, stage) {
    // Optimistic lane move; invalidate on settle so the server verdict wins.
    queryClient.setQueryData(["admin-crm-board"], (prev) => {
      if (!prev?.rows) return prev;
      return {
        ...prev,
        rows: prev.rows.map((r) => (r.card_id === cardId ? { ...r, stage } : r)),
      };
    });
    try {
      const res = await fetch(`/api/admin/crm-cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error(`Stage move → ${res.status}`);
    } finally {
      queryClient.invalidateQueries({ queryKey: ["admin-crm-board"] });
    }
  }

  function laneProps(stage) {
    return {
      onDragOver: (e) => {
        e.preventDefault(); // mandatory — without it drop never fires
        e.dataTransfer.dropEffect = "move";
        if (dragOverLane !== stage) setDragOverLane(stage);
      },
      onDragLeave: (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDragOverLane((cur) => (cur === stage ? null : cur));
      },
      onDrop: (e) => {
        e.preventDefault();
        setDragOverLane(null);
        const cardId = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isFinite(cardId) && cardId > 0) void moveCard(cardId, stage);
      },
    };
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>CRM board</h1>
          <p>One card per customer — drag between stages. Raw tables live in Data → CRM cards / Touchpoints.</p>
        </div>
      </div>

      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="crm-error">{String(error?.message || error)}</p> : null}
      {data?.error ? <p className="crm-error">{data.error}</p> : null}

      <div className="crm-board">
        {STAGES.map((stage) => {
          const cards = rows
            .filter((r) => r.stage === stage.slug)
            .sort((a, b) => (b.latest_lead?.submitted_at ?? "").localeCompare(a.latest_lead?.submitted_at ?? ""));
          return (
            <section
              key={stage.slug}
              className={[
                "crm-lane",
                stage.muted ? "crm-lane--muted" : "",
                dragOverLane === stage.slug ? "is-drag-over" : "",
              ].join(" ")}
              {...laneProps(stage.slug)}
            >
              <div className="crm-lane__head">
                <h2 className={`crm-lane__title${stage.tone === "active" ? " crm-lane__title--active" : ""}`}>
                  {stage.label}
                </h2>
                <span className="crm-lane__count">{cards.length}</span>
              </div>
              <p className="crm-lane__hint">{stage.hint}</p>
              <ul className="crm-lane__cards">
                {cards.map((card) => (
                  <li key={card.card_id}>
                    <BoardCard
                      card={card}
                      isDragging={draggingId === card.card_id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(card.card_id)); // Safari aborts without setData
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(card.card_id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverLane(null);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function BoardCard({ card, isDragging, onDragStart, onDragEnd }) {
  const suburb = suburbFrom(card.customer);
  const snoozed = card.snoozed_until && new Date(card.snoozed_until) > new Date();
  return (
    <Link
      href={`/admin/crm/${card.card_id}`}
      className={`crm-card${isDragging ? " is-dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="crm-card__name">
        <span>{card.customer?.name ?? "Unknown"}</span>
        <span className="crm-card__days">{daysIn(card.stage_changed_at)}</span>
      </div>
      <div className="crm-card__sub">
        {suburb || card.customer?.email || "—"}
        {card.last_touch ? ` · last ${card.last_touch.channel} ${daysIn(card.last_touch.created_at)}` : " · never touched"}
      </div>
      <div className="crm-card__chips">
        {card.latest_lead?.audience ? (
          <span className={`crm-chip crm-chip--${card.latest_lead.audience}`}>{card.latest_lead.audience}</span>
        ) : null}
        {card.lead_count > 1 ? <span className="crm-chip crm-chip--leads">{card.lead_count} leads</span> : null}
        {card.pending_action ? (
          <span className="crm-chip crm-chip--pending">{card.pending_action.channel} {card.pending_action.status}</span>
        ) : null}
        {card.auto_mode ? <span className="crm-chip crm-chip--auto">auto</span> : null}
        {snoozed ? <span className="crm-chip crm-chip--snoozed">snoozed</span> : null}
      </div>
    </Link>
  );
}

function daysIn(iso) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  return `${days}d`;
}

// "39 Gympie Street South, Landsborough QLD, Australia" → "Landsborough 4550".
function suburbFrom(customer) {
  const line = customer?.address_line;
  if (!line) return customer?.postcode ?? "";
  const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
  const seg = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  const cleaned = seg
    ?.replace(/\b(QLD|NSW|VIC|Australia)\b/gi, "")
    .replace(/\b\d{4}\b/g, "") // postcode gets re-appended below, once
    .trim();
  return [cleaned, customer?.postcode].filter(Boolean).join(" ");
}
