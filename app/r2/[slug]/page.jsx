import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase";
import LifecycleView from "./LifecycleView";
import ReportView from "./ReportView";
import "./report.css";

// Customer-facing page for a single inspection, identified by the
// unguessable `report_slug` (16+ chars). The slug is generated at
// booking time, so the URL is stable across the entire lifecycle:
//   scheduled  → BookedView (countdown, reschedule, cancel, prep)
//   in_progress → InProgressView (technician on-site)
//   completed   → LabPendingView (waiting for sign-off)
//   published   → ReportView (the diagnostic — current default)
//   cancelled   → CancelledView (rebooking CTA)
//
// We start with a light lookup (just enough to know the lifecycle state)
// and only run the heavy diagnostic select when the report is actually
// published — saves the round-trip for the much more common pre-report
// states.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `Sporetrust inspection · ${slug.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicReportPage({ params }) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();
  if (!supabase) notFound();

  // Light lookup — covers every state so we can pick the right view
  // without burning the heavy diagnostic select.
  const { data: head, error: headErr } = await supabase
    .from("inspections")
    .select(`
      inspection_id, scheduled_at, started_at, completed_at,
      duration_minutes, status, report_status, report_slug,
      cal_booking_id, inspection_type,
      customers(name, email, phone),
      properties(address_line, postcode, state),
      technician:technicians!inspections_technician_id_fkey(name, role, qualifications)
    `)
    .eq("report_slug", slug)
    .maybeSingle();

  if (headErr || !head) notFound();

  // Pre-publish lifecycle states: show the booking-management view, not
  // the diagnostic report.
  if (head.report_status !== "published") {
    return (
      <div className="report-page">
        <LifecycleView inspection={head} />
      </div>
    );
  }

  // Published — run the full diagnostic fetch.
  const select = `
    inspection_id, scheduled_at, started_at, completed_at,
    signed_off_at, report_slug, report_status, report_severity,
    report_title, report_summary, report_published_at, inspection_type, on_site_notes,
    customers(name),
    properties(address_line, postcode, state),
    technician:technicians!inspections_technician_id_fkey(name, role, qualifications),
    signoff:technicians!inspections_signed_off_by_technician_id_fkey(name, role, qualifications),
    sample_locations(
      sample_location_id, name, is_outdoor_control, mould_pressure_tier, thermal_delta_c,
      display_order, sampled_at, notes,
      image_captures(image_capture_id, capture_kind, storage_path, caption, pair_group),
      moisture_readings(moisture_reading_id, surface_label, reading_value, reading_unit, level, marker_x_pct, marker_y_pct, image_capture_id, depth_mm, instrument_model),
      location_findings(finding_id, observation, display_order),
      location_sources(source_id, rank, source_category, description, display_order),
      air_samples(
        air_sample_id, lab_sample_id, sampled_at, lab_partner,
        total_spores_per_m3, slide_trace_4x_outside_path,
        slide_trace_4x_inside_path, slide_30x_zoomed_path,
        dominant_fungal_classification_id,
        fungal_classifications(name, classification_group),
        air_sample_fungal_counts(
          air_sample_fungal_count_id, spores_per_m3, level,
          fungal_classifications(name, classification_group)
        )
      )
    ),
    scope_items(scope_item_id, scope_tier, cost_min, cost_max, detail, display_order,
                trade_categories(trade_category_id, name, group_label))
  `.replace(/\s+/g, " ");

  const { data: inspection, error } = await supabase
    .from("inspections")
    .select(select)
    .eq("report_slug", slug)
    .eq("report_status", "published")
    .maybeSingle();

  if (error || !inspection) notFound();

  // Partner match for the report's "Our Suggested Fix" pathway.
  const tradeIds = Array.from(
    new Set(
      (inspection.scope_items || [])
        .map((s) => s.trade_categories?.trade_category_id)
        .filter(Boolean),
    ),
  );

  let partners = [];
  if (tradeIds.length > 0) {
    const { data: matchedSkills } = await supabase
      .from("partner_skills")
      .select(`
        trade_category_id,
        trade_categories(name, group_label),
        partner_organizations(
          partner_id, name, credentials, service_areas,
          contact_email, contact_phone, rating, reviews_count, notes, active
        )
      `)
      .in("trade_category_id", tradeIds);

    const byPartner = new Map();
    for (const row of matchedSkills || []) {
      const p = row.partner_organizations;
      if (!p || !p.active) continue;
      const existing = byPartner.get(p.partner_id);
      const trade = row.trade_categories?.name;
      if (existing) {
        if (trade && !existing.matchedTrades.includes(trade)) existing.matchedTrades.push(trade);
      } else {
        byPartner.set(p.partner_id, {
          ...p,
          matchedTrades: trade ? [trade] : [],
        });
      }
    }
    partners = Array.from(byPartner.values());
  }

  return (
    <div className="report-page">
      <ReportView inspection={inspection} partners={partners} />
    </div>
  );
}
