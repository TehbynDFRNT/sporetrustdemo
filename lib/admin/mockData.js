// Mock rows shaped to schema.sql. Used by every /api/admin/* route until
// the Supabase server client is wired up. Delete this file when going live.

const T = (iso) => iso; // identity — kept readable so the rows look like ISO strings.

export const mockData = {
  technicians: [
    {
      technician_id: 1, clerk_user_id: null,
      email: "j.rivera@sporetrust.com.au", name: "J. Rivera", phone: "+61 411 800 110",
      role: "field", qualifications: "IICRC ASD",
      active: true, created_at: T("2026-01-08T01:00:00Z"), updated_at: T("2026-01-08T01:00:00Z"),
    },
    {
      technician_id: 2, clerk_user_id: null,
      email: "m.saito@sporetrust.com.au", name: "M. Saito", phone: "+61 411 800 220",
      role: "field", qualifications: "IICRC WRT · AMRT (in progress)",
      active: true, created_at: T("2026-01-08T01:00:00Z"), updated_at: T("2026-01-08T01:00:00Z"),
    },
    {
      technician_id: 3, clerk_user_id: null,
      email: "s.patel@sporetrust.com.au", name: "S. Patel", phone: "+61 411 800 330",
      role: "qualified", qualifications: "IICRC AMRT · S520 · NATA accredited reviewer",
      active: true, created_at: T("2026-01-08T01:00:00Z"), updated_at: T("2026-01-08T01:00:00Z"),
    },
    {
      technician_id: 4, clerk_user_id: null,
      email: "ops@sporetrust.com.au", name: "Operations", phone: null,
      role: "admin", qualifications: null,
      active: true, created_at: T("2026-01-08T01:00:00Z"), updated_at: T("2026-01-08T01:00:00Z"),
    },
  ],

  customers: [
    {
      customer_id: 1, clerk_user_id: "user_2ZsLCAfk1...", stripe_customer_id: "cus_PqXY7r9...",
      email: "lila.tan@example.com", name: "Lila Tan", phone: "+61 411 222 333",
      customer_type: "individual", created_at: T("2026-04-12T01:14:00Z"), updated_at: T("2026-04-12T01:14:00Z"),
    },
    {
      customer_id: 2, clerk_user_id: null, stripe_customer_id: null,
      email: "rentals@bayside-pm.com.au", name: "Bayside Property Management", phone: "+61 7 3201 4400",
      customer_type: "property_manager", created_at: T("2026-04-18T22:03:00Z"), updated_at: T("2026-04-18T22:03:00Z"),
    },
    {
      customer_id: 3, clerk_user_id: "user_2ZsLDB...", stripe_customer_id: "cus_PqYabc...",
      email: "owen.hughes@example.com", name: "Owen Hughes", phone: "+61 422 555 887",
      customer_type: "individual", created_at: T("2026-05-02T05:42:00Z"), updated_at: T("2026-05-02T05:42:00Z"),
    },
  ],

  properties: [
    { property_id: 1, address_line: "12 Banksia Street, Toowong", postcode: "4066", state: "QLD", google_place_id: "ChIJ0001…", lat: -27.4844, lng: 152.9921, created_at: T("2026-04-12T01:14:00Z") },
    { property_id: 2, address_line: "8/241 Wynnum Road, Norman Park", postcode: "4170", state: "QLD", google_place_id: "ChIJ0002…", lat: -27.4769, lng: 153.0658, created_at: T("2026-04-18T22:03:00Z") },
    { property_id: 3, address_line: "44 Lytton Road, East Brisbane", postcode: "4169", state: "QLD", google_place_id: null, lat: -27.4805, lng: 153.0387, created_at: T("2026-05-02T05:42:00Z") },
  ],

  inspections: [
    {
      inspection_id: 1, customer_id: 1, property_id: 1, cal_booking_id: "cal_evt_abc123",
      stripe_payment_intent_id: "pi_3PqL...", amount_paid: 595.00,
      scheduled_at: T("2026-04-20T23:00:00Z"), duration_minutes: 90,
      status: "completed", inspection_type: "standard",
      technician_id: 1,
      started_at: T("2026-04-20T23:05:00Z"), completed_at: T("2026-04-21T00:32:00Z"),
      signed_off_by_technician_id: 3, signed_off_at: T("2026-04-22T04:50:00Z"),
      report_slug: "rpt_abc12345xyzfgh67", report_status: "published",
      report_severity: "moderate", report_summary: "Cold-bridge condensation behind SE corner cavity.",
      report_published_at: T("2026-04-22T05:01:00Z"),
      created_at: T("2026-04-12T01:14:00Z"), updated_at: T("2026-04-22T05:01:00Z"),
    },
    {
      inspection_id: 2, customer_id: 2, property_id: 2, cal_booking_id: "cal_evt_def456",
      stripe_payment_intent_id: "pi_3PrM...", amount_paid: 595.00,
      scheduled_at: T("2026-05-08T03:30:00Z"), duration_minutes: 90,
      status: "scheduled", inspection_type: "lab_backed",
      technician_id: null,
      signed_off_by_technician_id: null, signed_off_at: null,
      report_slug: null, report_status: "draft",
      created_at: T("2026-04-18T22:03:00Z"), updated_at: T("2026-04-18T22:03:00Z"),
    },
    {
      inspection_id: 3, customer_id: 3, property_id: 3, cal_booking_id: "cal_evt_ghi789",
      stripe_payment_intent_id: "pi_3PsN...", amount_paid: 595.00,
      scheduled_at: T("2026-05-13T22:30:00Z"), duration_minutes: 90,
      status: "in_progress", inspection_type: "standard",
      technician_id: 2,
      started_at: T("2026-05-13T22:34:00Z"),
      signed_off_by_technician_id: null, signed_off_at: null,
      report_slug: null, report_status: "draft",
      created_at: T("2026-05-02T05:42:00Z"), updated_at: T("2026-05-13T22:34:00Z"),
    },
  ],

  "sample-locations": [
    { sample_location_id: 1, inspection_id: 1, name: "Bedroom 1", is_outdoor_control: false, mould_pressure_tier: "moderate", thermal_delta_c: -6.30, display_order: 0, sampled_at: T("2026-04-20T23:18:00Z"), created_at: T("2026-04-20T23:18:00Z"), updated_at: T("2026-04-20T23:18:00Z") },
    { sample_location_id: 2, inspection_id: 1, name: "Master ensuite", is_outdoor_control: false, mould_pressure_tier: "low", thermal_delta_c: -1.20, display_order: 1, sampled_at: T("2026-04-20T23:42:00Z"), created_at: T("2026-04-20T23:42:00Z"), updated_at: T("2026-04-20T23:42:00Z") },
    { sample_location_id: 3, inspection_id: 1, name: "Outdoor control", is_outdoor_control: true, mould_pressure_tier: "normal", thermal_delta_c: 0.00, display_order: 99, sampled_at: T("2026-04-21T00:05:00Z"), created_at: T("2026-04-21T00:05:00Z"), updated_at: T("2026-04-21T00:05:00Z") },
    { sample_location_id: 4, inspection_id: 3, name: "Laundry", is_outdoor_control: false, mould_pressure_tier: "high", thermal_delta_c: -8.10, display_order: 0, sampled_at: T("2026-05-13T22:55:00Z"), created_at: T("2026-05-13T22:55:00Z"), updated_at: T("2026-05-13T22:55:00Z") },
  ],

  "image-captures": [
    { image_capture_id: 1, sample_location_id: 1, capture_kind: "visible",  pair_group: 1, storage_path: "inspection-images/1/bed1-vis-001.jpg", caption: "SE corner from doorway", captured_at: T("2026-04-20T23:20:00Z") },
    { image_capture_id: 2, sample_location_id: 1, capture_kind: "thermal",  pair_group: 1, storage_path: "inspection-images/1/bed1-th-001.jpg",  caption: "SE corner — cold patch visible", captured_at: T("2026-04-20T23:20:00Z") },
    { image_capture_id: 3, sample_location_id: 4, capture_kind: "visible",  pair_group: 1, storage_path: "inspection-images/3/laundry-vis-001.jpg", captured_at: T("2026-05-13T22:57:00Z") },
    { image_capture_id: 4, sample_location_id: 4, capture_kind: "thermal",  pair_group: 1, storage_path: "inspection-images/3/laundry-th-001.jpg", captured_at: T("2026-05-13T22:57:00Z") },
  ],

  "moisture-readings": [
    { moisture_reading_id: 1, sample_location_id: 1, surface_label: "Wall — SE corner", reading_value: 17.80, reading_unit: "%MC", level: "severe",   image_capture_id: 1, marker_x_pct: 72.00, marker_y_pct: 44.00, instrument_model: "Wagner Orion 940", depth_mm: 25.00, measured_at: T("2026-04-20T23:25:00Z") },
    { moisture_reading_id: 2, sample_location_id: 1, surface_label: "Skirting — SE",     reading_value: 15.40, reading_unit: "%MC", level: "moderate", image_capture_id: 1, marker_x_pct: 78.00, marker_y_pct: 82.00, instrument_model: "Wagner Orion 940", depth_mm: 25.00, measured_at: T("2026-04-20T23:26:00Z") },
    { moisture_reading_id: 3, sample_location_id: 1, surface_label: "Ceiling — centre",  reading_value:  9.20, reading_unit: "%MC", level: "normal",   image_capture_id: 1, marker_x_pct: 50.00, marker_y_pct: 14.00, instrument_model: "Wagner Orion 940", depth_mm: 25.00, measured_at: T("2026-04-20T23:27:00Z") },
    { moisture_reading_id: 4, sample_location_id: 4, surface_label: "Wall behind dryer", reading_value: 24.10, reading_unit: "%MC", level: "severe",   instrument_model: "Wagner Orion 940", depth_mm: 25.00, measured_at: T("2026-05-13T22:58:00Z") },
  ],

  "location-findings": [
    { finding_id: 1, sample_location_id: 1, observation: "Localised moisture concentration at SE wall corner, ~1.2m above floor. Thermal shows a −6.3 °C cold patch; pinless moisture confirms 15.4 – 17.8 % in substrate without visible staining.", display_order: 0, recorded_at: T("2026-04-21T00:10:00Z"), created_at: T("2026-04-21T00:10:00Z"), updated_at: T("2026-04-21T00:10:00Z") },
    { finding_id: 2, sample_location_id: 4, observation: "High moisture behind the dryer wall — wall plate damp to >24% MC. Likely waste-water leak.", display_order: 0, recorded_at: T("2026-05-13T23:05:00Z"), created_at: T("2026-05-13T23:05:00Z"), updated_at: T("2026-05-13T23:05:00Z") },
  ],

  "location-sources": [
    { source_id: 1, sample_location_id: 1, rank: "primary",   source_category: "condensation", description: "Cold-bridge condensation behind cavity at SE corner — single-glazed sliding-door reveal + insufficient sub-floor ventilation.", display_order: 0, created_at: T("2026-04-21T00:11:00Z") },
    { source_id: 2, sample_location_id: 1, rank: "secondary", source_category: "walls",        description: "Trace vapour-barrier damage at door sill — re-inspect during remediation.", display_order: 1, created_at: T("2026-04-21T00:11:00Z") },
    { source_id: 3, sample_location_id: 4, rank: "primary",   source_category: "plumbing",     description: "Suspected waste-water leak from washing-machine standpipe.", display_order: 0, created_at: T("2026-05-13T23:06:00Z") },
  ],

  "air-samples": [
    {
      air_sample_id: 1, sample_location_id: 1, lab_partner: "sporecyte", lab_sample_id: "SPC-2026-04-1187",
      air_volume_litres: 75.00, sampled_at: T("2026-04-21T00:30:00Z"),
      received_by_lab_at: T("2026-04-22T01:00:00Z"), reported_by_lab_at: T("2026-04-24T03:00:00Z"),
      slide_trace_4x_outside_path: "air-slides/1/sl1-trace-out.jpg",
      slide_trace_4x_inside_path:  "air-slides/1/sl1-trace-in.jpg",
      slide_30x_zoomed_path:        "air-slides/1/sl1-30x.jpg",
      total_spores_per_m3: 487, dominant_fungal_classification_id: 4,
      lab_pdf_storage_path: "lab-pdfs/1/sporecyte-rpt-2026-04-1187.pdf",
      created_at: T("2026-04-22T01:00:00Z"), updated_at: T("2026-04-24T03:00:00Z"),
    },
    {
      air_sample_id: 2, sample_location_id: 3, lab_partner: "sporecyte", lab_sample_id: "SPC-2026-04-1188",
      air_volume_litres: 75.00, sampled_at: T("2026-04-21T00:32:00Z"),
      received_by_lab_at: T("2026-04-22T01:00:00Z"), reported_by_lab_at: T("2026-04-24T03:00:00Z"),
      slide_30x_zoomed_path: "air-slides/2/sl3-30x.jpg",
      total_spores_per_m3: 32, dominant_fungal_classification_id: 2,
      lab_pdf_storage_path: "lab-pdfs/1/sporecyte-rpt-2026-04-1188.pdf",
      created_at: T("2026-04-22T01:00:00Z"), updated_at: T("2026-04-24T03:00:00Z"),
    },
  ],

  "air-sample-fungal-counts": [
    { air_sample_fungal_count_id: 1, air_sample_id: 1, fungal_classification_id: 4, spores_per_m3: 520, level: "moderate", created_at: T("2026-04-24T03:00:00Z") },
    { air_sample_fungal_count_id: 2, air_sample_id: 1, fungal_classification_id: 5, spores_per_m3: 120, level: "normal",   created_at: T("2026-04-24T03:00:00Z") },
    { air_sample_fungal_count_id: 3, air_sample_id: 2, fungal_classification_id: 2, spores_per_m3:  13, level: "normal",   created_at: T("2026-04-24T03:00:00Z") },
  ],

  "air-sample-particulate-counts": [
    { air_sample_particulate_count_id: 1, air_sample_id: 1, particulate_type_id: 3, particles_per_m3:    413, created_at: T("2026-04-24T03:00:00Z") },
    { air_sample_particulate_count_id: 2, air_sample_id: 1, particulate_type_id: 8, particles_per_m3:  70876, created_at: T("2026-04-24T03:00:00Z") },
  ],

  "air-sample-notable-objects": [
    { notable_object_id: 1, air_sample_id: 1, fungal_classification_id: 4, particulate_type_id: null, label: "Aspergillus / Penicillium", image_storage_path: "notable/1/asp-pen-1.jpg", display_order: 0, created_at: T("2026-04-24T03:00:00Z") },
    { notable_object_id: 2, air_sample_id: 1, fungal_classification_id: 1, particulate_type_id: null, label: "Ascospore",                  image_storage_path: "notable/1/ascospore-1.jpg", display_order: 1, created_at: T("2026-04-24T03:00:00Z") },
    { notable_object_id: 3, air_sample_id: 1, fungal_classification_id: null, particulate_type_id: 4, label: "Skin Fragment Animal",       image_storage_path: "notable/1/skin-animal-1.jpg", display_order: 2, created_at: T("2026-04-24T03:00:00Z") },
  ],

  "scope-items": [
    { scope_item_id: 1, inspection_id: 1, trade_category_id: 1, scope_tier: "minor",    cost_min:  400.00, cost_max:   800.00, detail: "Decontamination and surface treatment at SE wall corner.", display_order: 0, created_at: T("2026-04-22T05:01:00Z"), updated_at: T("2026-04-22T05:01:00Z") },
    { scope_item_id: 2, inspection_id: 1, trade_category_id: 3, scope_tier: "moderate", cost_min:  900.00, cost_max: 1800.00, detail: "Lift skirting at SE corner, vapour-barrier check, re-flash door sill.", display_order: 1, created_at: T("2026-04-22T05:01:00Z"), updated_at: T("2026-04-22T05:01:00Z") },
    { scope_item_id: 3, inspection_id: 1, trade_category_id: 4, scope_tier: "moderate", cost_min: 1100.00, cost_max: 1500.00, detail: "Sub-floor ventilation upgrade + bathroom exhaust re-routing.", display_order: 2, created_at: T("2026-04-22T05:01:00Z"), updated_at: T("2026-04-22T05:01:00Z") },
  ],

  "partner-organizations": [
    { partner_id: 1, name: "DryRight Mould Remediation", clerk_org_id: null, contact_email: "ops@dryright.com.au", contact_phone: "+61 7 3399 1100", credentials: "IICRC S520-trained", service_areas: ["4066","4067","4068","4170","4169"], active: true,  rating: 4.9, reviews_count: 84,  created_at: T("2026-01-12T01:00:00Z"), updated_at: T("2026-01-12T01:00:00Z") },
    { partner_id: 2, name: "Bayside Building & Trades",  clerk_org_id: null, contact_email: "office@baysidetrades.com.au", contact_phone: "+61 7 3893 7700", credentials: "QBCC 1058219",       service_areas: ["4170","4169","4178","4179"],             active: true,  rating: 4.8, reviews_count: 142, created_at: T("2026-02-04T01:00:00Z"), updated_at: T("2026-02-04T01:00:00Z") },
    { partner_id: 3, name: "BrisVent Sub-floor Co.",     clerk_org_id: null, contact_email: "hello@brisvent.com.au",   contact_phone: "+61 7 3290 1234", credentials: "Licensed ventilation specialist", service_areas: ["4066","4067","4068","4101","4102"], active: true, rating: 4.7, reviews_count: 38, created_at: T("2026-03-09T01:00:00Z"), updated_at: T("2026-03-09T01:00:00Z") },
  ],

  "partner-skills": [
    { rowid: "1-1", partner_id: 1, trade_category_id: 1, created_at: T("2026-01-12T01:00:00Z") },
    { rowid: "2-3", partner_id: 2, trade_category_id: 3, created_at: T("2026-02-04T01:00:00Z") },
    { rowid: "2-2", partner_id: 2, trade_category_id: 2, created_at: T("2026-02-04T01:00:00Z") },
    { rowid: "3-4", partner_id: 3, trade_category_id: 4, created_at: T("2026-03-09T01:00:00Z") },
  ],

  "partner-handoffs": [
    { handoff_id: 1, inspection_id: 1, partner_id: 1, status: "introduced", notes: "Customer asked to schedule containment first.", introduced_at: T("2026-04-23T01:00:00Z"), created_at: T("2026-04-22T06:00:00Z"), updated_at: T("2026-04-23T01:00:00Z") },
    { handoff_id: 2, inspection_id: 1, partner_id: 2, status: "matched",    notes: null,                                              introduced_at: null,                       created_at: T("2026-04-22T06:00:00Z"), updated_at: T("2026-04-22T06:00:00Z") },
    { handoff_id: 3, inspection_id: 1, partner_id: 3, status: "matched",    notes: null,                                              introduced_at: null,                       created_at: T("2026-04-22T06:00:00Z"), updated_at: T("2026-04-22T06:00:00Z") },
  ],

  subscriptions: [
    { subscription_id: 1, customer_id: 1, property_id: 1, stripe_subscription_id: "sub_1PqL...", plan: "sentinel", status: "active",    weekly_amount: 22.95, current_period_end: T("2026-05-19T01:14:00Z"), started_at: T("2026-04-22T06:30:00Z"), cancelled_at: null,                       created_at: T("2026-04-22T06:30:00Z"), updated_at: T("2026-04-22T06:30:00Z") },
    { subscription_id: 2, customer_id: 3, property_id: 3, stripe_subscription_id: null,         plan: "sentinel", status: "cancelled", weekly_amount: 22.95, current_period_end: null,                       started_at: T("2026-03-01T03:00:00Z"), cancelled_at: T("2026-04-10T03:00:00Z"), created_at: T("2026-03-01T03:00:00Z"), updated_at: T("2026-04-10T03:00:00Z") },
  ],

  "trade-categories": [
    { trade_category_id: 1, slug: "mould-cleanup",       name: "Mould cleanup",       group_label: "Remediation",     display_order: 0, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 2, slug: "containment",        name: "Containment",         group_label: "Remediation",     display_order: 1, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 3, slug: "carpenter",          name: "Carpenter",           group_label: "Likely repairs",  display_order: 0, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 4, slug: "ventilation",        name: "Ventilation specialist", group_label: "Likely repairs", display_order: 1, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 5, slug: "plumber",            name: "Plumber",             group_label: "Likely repairs",  display_order: 2, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 6, slug: "roofer",             name: "Roofer",              group_label: "Likely repairs",  display_order: 3, active: true, created_at: T("2026-01-01T00:00:00Z") },
    { trade_category_id: 7, slug: "waterproofing",      name: "Waterproofing",       group_label: "Likely repairs",  display_order: 4, active: true, created_at: T("2026-01-01T00:00:00Z") },
  ],

  "fungal-classifications": [
    { fungal_classification_id: 1, slug: "ascospore",                 name: "Ascospore",                 classification_group: "predominantly_outdoor",            habitat: "Outdoor, decaying vegetation.",                                         health_notes: "Low health relevance indoors; outdoor baseline only.", source_url: "https://sporecyte.com/fungal-glossary/", updated_at: T("2026-01-15T00:00:00Z") },
    { fungal_classification_id: 2, slug: "basidiospore",              name: "Basidiospore",              classification_group: "predominantly_outdoor",            habitat: "Outdoor, wood-rotting fungi.",                                          health_notes: "Outdoor baseline.",                                  source_url: "https://sporecyte.com/fungal-glossary/", updated_at: T("2026-01-15T00:00:00Z") },
    { fungal_classification_id: 3, slug: "stachybotrys",              name: "Stachybotrys",              classification_group: "predominantly_indoor_water_related", habitat: "Wet cellulose — saturated drywall, ceiling tiles.",                    health_notes: "Often described as the 'black mould'. Indoor presence indicates active wetting.", source_url: "https://sporecyte.com/fungal-glossary/", updated_at: T("2026-01-15T00:00:00Z") },
    { fungal_classification_id: 4, slug: "aspergillus-penicillium",   name: "Aspergillus / Penicillium", classification_group: "indoor_outdoor",                  habitat: "Both indoor and outdoor; common indoor amplifier in damp homes.",      health_notes: "Allergenic; some species mycotoxic. Elevated indoor counts vs outdoor warrant action.", source_url: "https://sporecyte.com/fungal-glossary/", updated_at: T("2026-01-15T00:00:00Z") },
    { fungal_classification_id: 5, slug: "cladosporium",              name: "Cladosporium",              classification_group: "indoor_outdoor",                  habitat: "Indoor and outdoor; very common allergen.",                              health_notes: "Allergenic — elevated indoor levels can drive respiratory symptoms.", source_url: "https://sporecyte.com/fungal-glossary/", updated_at: T("2026-01-15T00:00:00Z") },
  ],

  "particulate-types": [
    { particulate_type_id: 1, slug: "hypha",                name: "Hypha",                 kind: "category",  display_order: 0, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 2, slug: "pollen",               name: "Pollen",                kind: "category",  display_order: 1, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 3, slug: "skin-fragment-human",  name: "Skin Fragment Human",   kind: "category",  display_order: 2, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 4, slug: "skin-fragment-animal", name: "Skin Fragment Animal",  kind: "category",  display_order: 3, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 5, slug: "carbon-dust",          name: "Carbon Dust",           kind: "category",  display_order: 4, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 6, slug: "soil",                 name: "Soil",                  kind: "category",  display_order: 5, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 7, slug: "fiber",                name: "Fiber",                 kind: "category",  display_order: 6, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 8, slug: "total-lt-2-5um",       name: "Total Particulate < 2.5 µm", kind: "size_total", display_order: 100, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 9, slug: "total-2-5-10um",       name: "Total Particulate 2.5 – 10 µm", kind: "size_total", display_order: 101, created_at: T("2026-01-15T00:00:00Z") },
    { particulate_type_id: 10, slug: "total-gt-10um",       name: "Total Particulate > 10 µm",     kind: "size_total", display_order: 102, created_at: T("2026-01-15T00:00:00Z") },
  ],
};
