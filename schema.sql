-- =====================================================================
-- Sporetrust — declarative schema for the diagnostic report backend
-- =====================================================================
--
-- Target: PostgreSQL 15+ / Supabase.
-- Auth: Clerk (user IDs stored as TEXT on customers + partner orgs).
-- Payments: Stripe (customer + subscription + payment-intent IDs stored as TEXT).
-- File storage: Supabase Storage buckets; only the object key (path) is in the DB.
--
-- Design principles:
--   * snake_case everywhere
--   * BIGINT GENERATED ALWAYS AS IDENTITY for surrogate PKs
--   * TIMESTAMPTZ for every event time (NEVER `timestamp`)
--   * NUMERIC for money + scientific measurements (NEVER float / money)
--   * TEXT + CHECK for business enums that may evolve
--   * Manual indexes on every FK column (Postgres does not auto-index)
--   * NO JSONB — everything is structured so the dataset is reconcilable to
--     (address, timestamp) and usable as future insurance / training data
--   * Every measurement-bearing row carries its own captured/measured/sampled timestamp
--
-- Hierarchy:
--     property
--      └─ inspection (timestamped diagnostic visit)
--          ├─ sample_location (one per room / outdoor control)
--          │   ├─ image_capture       (visible + thermal pair)
--          │   ├─ moisture_reading    (many)
--          │   ├─ location_finding    (narrative obs)
--          │   ├─ location_source     (ranked likely cause)
--          │   └─ air_sample          (one, lab-issued)
--          │        ├─ air_sample_fungal_count       (per fungal_classification)
--          │        ├─ air_sample_particulate_count  (per particulate_type)
--          │        └─ air_sample_notable_object     (clipped specimen image)
--          ├─ scope_item              (technician-selected trade work)
--          └─ partner_handoff         (partner introductions for this inspection)
--
-- Matching algorithm (whole-inspection, NOT per-location):
--     partners.skills           ⊇ DISTINCT(scope_items.trade_category_id)
--     partners.service_areas    ∋ inspection.property.postcode
--     partners.active           = true
-- =====================================================================


-- =====================================================================
-- Shared trigger function for updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =====================================================================
-- REFERENCE / LOOKUP TABLES
-- =====================================================================

-- Trade categories: technician selects from these when defining the scope
-- of works. Partner skills also reference this list — that's the matching key.
CREATE TABLE trade_categories (
  trade_category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,                  -- 'plumber', 'mould-cleanup'
  name              TEXT NOT NULL,                         -- 'Plumber'
  group_label       TEXT NOT NULL,                         -- 'Remediation' | 'Likely repairs' (UI grouping)
  display_order     INTEGER NOT NULL DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trade_categories_group ON trade_categories (group_label);
-- display_order is the position WITHIN a group_label, so unique-per-group.
ALTER TABLE trade_categories
  ADD CONSTRAINT trade_categories_group_order_uq UNIQUE (group_label, display_order);


-- Fungal classifications: persistent glossary of fungal species. Populated
-- independently of inspections; air_sample_fungal_count and
-- air_sample_notable_object FK in.
CREATE TABLE fungal_classifications (
  fungal_classification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                     TEXT NOT NULL UNIQUE,           -- 'aspergillus-penicillium'
  name                     TEXT NOT NULL,                  -- 'Aspergillus / Penicillium'
  classification_group     TEXT NOT NULL CHECK (classification_group IN (
                             'predominantly_outdoor',
                             'predominantly_indoor_water_related',
                             'indoor_outdoor'
                           )),
  description              TEXT,                           -- glossary body
  habitat                  TEXT,                           -- where it lives
  health_notes             TEXT,                           -- health implications
  source_url               TEXT,                           -- citation
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fungal_classifications_group ON fungal_classifications (classification_group);
CREATE TRIGGER fungal_classifications_updated_at
  BEFORE UPDATE ON fungal_classifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Particulate types: non-fungal particulates AND size-bucket totals reported
-- by the lab (Hypha, Pollen, Skin Fragment Human, Carbon Dust,
-- Total Particulate < 2.5 µm, etc.).
CREATE TABLE particulate_types (
  particulate_type_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,                 -- 'hypha', 'total-lt-2-5um'
  name                TEXT NOT NULL,                        -- 'Hypha'
  kind                TEXT NOT NULL CHECK (kind IN ('category', 'size_total')),
  description         TEXT,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX particulate_types_kind ON particulate_types (kind);
ALTER TABLE particulate_types
  ADD CONSTRAINT particulate_types_order_uq UNIQUE (display_order);


-- =====================================================================
-- STAFF / TECHNICIANS
-- =====================================================================

-- Technicians: Sporetrust staff who conduct inspections and (qualified
-- roles only) sign off on the resulting reports. role gates the
-- permission to act as a sign-off authority on a field tech's report.
CREATE TABLE technicians (
  technician_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_user_id   TEXT UNIQUE,                                -- Clerk user (nullable)
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'field'
                    CHECK (role IN ('field', 'qualified', 'admin')),
  qualifications  TEXT,                                       -- 'IICRC S520', 'NATA accreditation #...'
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX technicians_email_lower_uq ON technicians (LOWER(email));
CREATE INDEX technicians_role   ON technicians (role);
CREATE INDEX technicians_active ON technicians (active) WHERE active;
CREATE TRIGGER technicians_updated_at
  BEFORE UPDATE ON technicians
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- EQUIPMENT (typed assets owned by technicians)
-- =====================================================================

-- Equipment catalogue. Each row carries an image so the wizard can
-- render card-based identification when a tech is picking which device
-- they used for a reading.
CREATE TABLE equipment_types (
  equipment_type_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  manufacturer       TEXT,
  category           TEXT NOT NULL CHECK (category IN (
                       'moisture_meter', 'thermal_camera', 'air_sampler',
                       'particle_counter', 'hygrometer', 'other'
                     )),
  image_storage_path TEXT,                                       -- Supabase Storage path (equipment-images bucket)
  notes              TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX equipment_types_category ON equipment_types (category);
CREATE INDEX equipment_types_active   ON equipment_types (active) WHERE active;
CREATE TRIGGER equipment_types_updated_at
  BEFORE UPDATE ON equipment_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- A tech's personal kit. One row per physical instrument they own —
-- asset_tag distinguishes "the SE corner Wagner" from "the spare Wagner".
CREATE TABLE technician_equipment (
  technician_equipment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  technician_id           BIGINT NOT NULL REFERENCES technicians(technician_id) ON DELETE CASCADE,
  equipment_type_id       BIGINT NOT NULL REFERENCES equipment_types(equipment_type_id) ON DELETE RESTRICT,
  asset_tag               TEXT,                                  -- 'SR-MOIST-001'
  serial                  TEXT,
  acquired_at             DATE,
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX technician_equipment_tech    ON technician_equipment (technician_id);
CREATE INDEX technician_equipment_type    ON technician_equipment (equipment_type_id);
CREATE INDEX technician_equipment_active  ON technician_equipment (active) WHERE active;
CREATE UNIQUE INDEX technician_equipment_asset_uq
  ON technician_equipment (technician_id, asset_tag) WHERE asset_tag IS NOT NULL;
CREATE TRIGGER technician_equipment_updated_at
  BEFORE UPDATE ON technician_equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- IDENTITY TABLES
-- =====================================================================

-- Customers: person/org that requested a diagnostic.
-- clerk_user_id is nullable — admin-booked customers exist before signup.
CREATE TABLE customers (
  customer_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_user_id       TEXT UNIQUE,                         -- Clerk user (nullable)
  stripe_customer_id  TEXT UNIQUE,                         -- created on first paid transaction
  email               TEXT NOT NULL,
  name                TEXT NOT NULL,
  phone               TEXT,
  -- Address on file + geocode. Captured at first touch (the lead form), so a
  -- customer has a location before any property/inspection exists. The
  -- SPECIFIC inspected address still lives on properties, per inspection.
  address_line        TEXT,
  postcode            TEXT,
  state               TEXT DEFAULT 'QLD',
  google_place_id     TEXT,
  lat                 NUMERIC(9, 6),
  lng                 NUMERIC(9, 6),
  customer_type       TEXT NOT NULL DEFAULT 'individual'
                       CHECK (customer_type IN ('individual', 'property_manager', 'business')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_email_lower_uq ON customers (LOWER(email));
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Properties: physical addresses. One property can be inspected many times.
-- The (address, postcode) combo is the natural reconciliation key for any
-- future de-personalised dataset.
CREATE TABLE properties (
  property_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  address_line    TEXT NOT NULL,
  postcode        TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'QLD',
  google_place_id TEXT,
  lat             NUMERIC(9, 6),
  lng             NUMERIC(9, 6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX properties_addr_uq
  ON properties (LOWER(address_line), postcode);
CREATE UNIQUE INDEX properties_place_id_uq
  ON properties (google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX properties_postcode ON properties (postcode);


-- Customer ↔ property linkage. Properties stay identity-only; the
-- relationship (who enquired/booked about the address, and as what) lives on
-- the join. Lets lead addresses populate properties without waiting for a
-- booking — the lead API and the booking flow both write through
-- lib/properties.js ensureProperty()/linkCustomerProperty().
CREATE TABLE customer_properties (
  customer_id  BIGINT NOT NULL REFERENCES customers(customer_id)  ON DELETE CASCADE,
  property_id  BIGINT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'unknown'
                CHECK (relationship IN ('resident', 'owner', 'manager', 'unknown')),
  source       TEXT NOT NULL DEFAULT 'lead' CHECK (source IN ('lead', 'booking', 'manual')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, property_id)
);
CREATE INDEX customer_properties_property ON customer_properties (property_id);


-- Leads: a marketing enquiry event + its ad attribution, pointing at a
-- customer. Identity + address live on customers (no snapshot). Deliberately
-- minimal — no pipeline status (TBD) and no inspection link (derivable later
-- via customer). `message` is the only per-enquiry free text with no other home.
CREATE TABLE leads (
  lead_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id   BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  audience      TEXT NOT NULL DEFAULT 'tenant'
                  CHECK (audience IN ('tenant', 'homeowner', 'property_manager')),
  message       TEXT,

  -- Attribution (paid-media; the data with no other home)
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  gclid         TEXT,
  fbclid        TEXT,
  landing_page  TEXT,
  form          TEXT,

  submitted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX leads_customer     ON leads (customer_id);
CREATE INDEX leads_created_at   ON leads (created_at);
CREATE INDEX leads_utm_campaign ON leads (utm_campaign) WHERE utm_campaign IS NOT NULL;


-- =====================================================================
-- CRM / PIPELINE
-- =====================================================================

-- CRM cards: one per customer — the deduped pipeline anchor. Leads stay
-- append-only enquiry events rolling up under one card; pipeline state lives
-- here, never on leads. Stage labels/order/hints are config-driven in
-- lib/crm/stages.js; the CHECK pins the slugs only.
CREATE TABLE crm_cards (
  card_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id       BIGINT NOT NULL UNIQUE REFERENCES customers(customer_id) ON DELETE CASCADE,
  stage             TEXT NOT NULL DEFAULT 'new'
                     CHECK (stage IN ('new', 'working', 'waitlist', 'booked', 'done', 'lost')),
  stage_changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  snoozed_until     TIMESTAMPTZ,                       -- "wait" actions park the card here
  auto_mode         BOOLEAN NOT NULL DEFAULT FALSE,    -- AI sms/email may send without approval
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_cards_stage   ON crm_cards (stage);
CREATE INDEX crm_cards_snoozed ON crm_cards (snoozed_until) WHERE snoozed_until IS NOT NULL;
CREATE TRIGGER crm_cards_updated_at
  BEFORE UPDATE ON crm_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Stamp stage_changed_at only when stage actually moves, so the generic
-- admin PATCH route stays dumb.
CREATE OR REPLACE FUNCTION crm_stamp_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER crm_cards_stage_change
  BEFORE UPDATE OF stage ON crm_cards
  FOR EACH ROW EXECUTE FUNCTION crm_stamp_stage_change();


-- Touchpoints: the card's timeline AND the outbound action queue in one
-- table. Queue lifecycle: draft → approved → sending → sent →
-- delivered|failed. Completed manual entries (calls, notes, inbound) land as
-- 'logged'; rejected suggestions as 'cancelled'. The 'sending' claim is
-- atomic (UPDATE ... WHERE status IN ('draft','approved') RETURNING) so a
-- touchpoint can never double-send.
CREATE TABLE touchpoints (
  touchpoint_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  card_id             BIGINT NOT NULL REFERENCES crm_cards(card_id) ON DELETE CASCADE,
  channel             TEXT NOT NULL CHECK (channel IN ('call', 'sms', 'email', 'note', 'system')),
  direction           TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  status              TEXT NOT NULL DEFAULT 'logged'
                       CHECK (status IN ('draft', 'approved', 'sending', 'sent',
                                         'delivered', 'failed', 'logged', 'cancelled')),
  origin              TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'ai', 'system')),

  template_key        TEXT,                   -- lib/crm/templates.js key, when drafted from one
  subject             TEXT,                   -- email only
  body                TEXT,                   -- message body / call talking points / note text
  to_address          TEXT,                   -- E.164 or email, snapshotted at send time

  schedule_at         TIMESTAMPTZ,            -- when an approved action becomes due
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,

  provider            TEXT CHECK (provider IN ('twilio', 'postmark')),
  provider_message_id TEXT,                   -- Twilio MessageSid / Postmark MessageID
  error               TEXT,

  disposition         TEXT CHECK (disposition IN
                       ('answered', 'voicemail', 'no_answer', 'busy',
                        'callback_requested', 'wrong_number')),
  outcome_notes       TEXT,                   -- human summary after a call / reply
  ai_reasoning        TEXT,                   -- why the AI suggested this action

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX touchpoints_card       ON touchpoints (card_id);
CREATE INDEX touchpoints_created_at ON touchpoints (created_at DESC);
CREATE INDEX touchpoints_queue      ON touchpoints (schedule_at)
  WHERE status IN ('draft', 'approved');
CREATE UNIQUE INDEX touchpoints_provider_msg_uq
  ON touchpoints (provider, provider_message_id) WHERE provider_message_id IS NOT NULL;
-- At most one pending AI suggestion per card — stops suggestion pileup when
-- the cron and a human hit suggest at the same time.
CREATE UNIQUE INDEX touchpoints_one_pending_ai
  ON touchpoints (card_id) WHERE status = 'draft' AND origin = 'ai';
CREATE TRIGGER touchpoints_updated_at
  BEFORE UPDATE ON touchpoints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- INSPECTION
-- =====================================================================

-- Inspections: the diagnostic visit. Doubles as the report parent — the
-- "report" is just the published view over this inspection's data.
CREATE TABLE inspections (
  inspection_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id              BIGINT NOT NULL REFERENCES customers(customer_id)  ON DELETE RESTRICT,
  property_id              BIGINT NOT NULL REFERENCES properties(property_id) ON DELETE RESTRICT,

  -- External booking + payment refs
  cal_booking_id           TEXT,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_paid              NUMERIC(10, 2) CHECK (amount_paid >= 0),

  -- Scheduling
  scheduled_at             TIMESTAMPTZ NOT NULL,
  duration_minutes         INTEGER NOT NULL DEFAULT 90 CHECK (duration_minutes > 0),
  status                   TEXT NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  inspection_type          TEXT NOT NULL DEFAULT 'standard'
                            CHECK (inspection_type IN ('standard', 'lab_backed', 'sentinel_annual', 'clearance')),

  -- On-site
  technician_id            BIGINT REFERENCES technicians(technician_id) ON DELETE RESTRICT,
  on_site_notes            TEXT,
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,

  -- Qualified-technician sign-off (required to publish a report)
  signed_off_by_technician_id BIGINT REFERENCES technicians(technician_id) ON DELETE RESTRICT,
  signed_off_at               TIMESTAMPTZ,

  -- "Today's kit" gate. NULL means the technician still needs to
  -- confirm what equipment they've brought before the wizard unlocks.
  kit_confirmed_at         TIMESTAMPTZ,

  -- Report (the deliverable). report_slug is the unguessable share URL fragment.
  report_slug              TEXT UNIQUE CHECK (report_slug IS NULL OR LENGTH(report_slug) >= 16),
  report_status            TEXT NOT NULL DEFAULT 'draft'
                            CHECK (report_status IN ('draft', 'published', 'archived')),
  report_severity          TEXT CHECK (report_severity IN ('none', 'low', 'moderate', 'high', 'severe')),
  report_title             TEXT,                                  -- inspection-level headline (what + where), distinct from any per-room finding
  report_summary           TEXT,                                  -- reviewer narrative shown under the title
  report_published_at      TIMESTAMPTZ,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A published report must carry a qualified-technician sign-off.
  CONSTRAINT inspections_published_requires_signoff CHECK (
    report_status <> 'published'
    OR (signed_off_by_technician_id IS NOT NULL AND signed_off_at IS NOT NULL)
  )
);
CREATE INDEX inspections_customer       ON inspections (customer_id);
CREATE INDEX inspections_technician     ON inspections (technician_id)            WHERE technician_id IS NOT NULL;
CREATE INDEX inspections_signoff        ON inspections (signed_off_by_technician_id) WHERE signed_off_by_technician_id IS NOT NULL;
CREATE INDEX inspections_property       ON inspections (property_id);
CREATE INDEX inspections_scheduled_at   ON inspections (scheduled_at);
CREATE INDEX inspections_status         ON inspections (status);
CREATE INDEX inspections_report_status  ON inspections (report_status);
CREATE INDEX inspections_published_at   ON inspections (report_published_at) WHERE report_published_at IS NOT NULL;
CREATE INDEX inspections_kit_confirmed  ON inspections (kit_confirmed_at) WHERE kit_confirmed_at IS NOT NULL;
CREATE UNIQUE INDEX inspections_cal_booking_uq
  ON inspections (cal_booking_id) WHERE cal_booking_id IS NOT NULL;
CREATE TRIGGER inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- "Today's kit": which of a technician's assigned equipment they've
-- checked off as on-hand for THIS inspection. Pure join — inserts /
-- deletes map directly to the checkbox state in the landing-page gate.
CREATE TABLE inspection_equipment (
  inspection_id            BIGINT NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
  technician_equipment_id  BIGINT NOT NULL REFERENCES technician_equipment(technician_equipment_id) ON DELETE CASCADE,
  added_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (inspection_id, technician_equipment_id)
);
CREATE INDEX inspection_equipment_tech_eq ON inspection_equipment (technician_equipment_id);


-- =====================================================================
-- SAMPLE LOCATION (room / zone within an inspection)
-- =====================================================================

-- One sample_location per area inspected, including an outdoor control.
-- Each carries its own sampled_at — important for de-personalised data and
-- the future internal tool.
CREATE TABLE sample_locations (
  sample_location_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id         BIGINT NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,                              -- 'Kitchen', 'Outdoor Control'
  is_outdoor_control    BOOLEAN NOT NULL DEFAULT FALSE,
  mould_pressure_tier   TEXT CHECK (mould_pressure_tier IN (
                          'normal', 'low', 'moderate', 'high', 'severe'
                        )),
  thermal_delta_c       NUMERIC(5, 2),                              -- Δ vs room reference
  display_order         INTEGER NOT NULL DEFAULT 0,
  notes                 TEXT,
  sampled_at            TIMESTAMPTZ NOT NULL DEFAULT now(),         -- when the technician was here
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sample_locations_inspection ON sample_locations (inspection_id);
CREATE INDEX sample_locations_sampled_at ON sample_locations (sampled_at);
-- Only one outdoor control per inspection
CREATE UNIQUE INDEX sample_locations_one_outdoor
  ON sample_locations (inspection_id) WHERE is_outdoor_control;
ALTER TABLE sample_locations
  ADD CONSTRAINT sample_locations_order_uq UNIQUE (inspection_id, display_order);
CREATE TRIGGER sample_locations_updated_at
  BEFORE UPDATE ON sample_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- PER-LOCATION DATA TABLES
-- =====================================================================

-- Image captures: visible + thermal photo pairs. The pair_group integer
-- groups a (visible, thermal) shot of the same physical frame.
CREATE TABLE image_captures (
  image_capture_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_location_id  BIGINT NOT NULL REFERENCES sample_locations(sample_location_id) ON DELETE CASCADE,
  capture_kind        TEXT NOT NULL CHECK (capture_kind IN ('visible', 'thermal', 'moisture_evidence', 'air_evidence')),
  storage_path        TEXT NOT NULL,                                -- Supabase Storage object key
  caption             TEXT,
  pair_group          INTEGER NOT NULL DEFAULT 1,
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX image_captures_location ON image_captures (sample_location_id);
CREATE UNIQUE INDEX image_captures_pair_kind_uq
  ON image_captures (sample_location_id, pair_group, capture_kind);


-- Moisture readings: many per location. Optional FK to a paired image so the
-- UI overlay (markers on the photo) can position the reading dot.
CREATE TABLE moisture_readings (
  moisture_reading_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_location_id    BIGINT NOT NULL REFERENCES sample_locations(sample_location_id) ON DELETE CASCADE,
  surface_label         TEXT   NOT NULL,                            -- 'Wall — SE corner'
  reading_value         NUMERIC(5, 2) NOT NULL,                     -- 17.8
  reading_unit          TEXT   NOT NULL DEFAULT '%MC',              -- moisture content percent
  level                 TEXT   NOT NULL CHECK (level IN ('normal', 'low', 'moderate', 'high', 'severe')),

  -- Visual overlay positioning (optional) — points at the wide visible
  -- reference shot for this location so the reading can be plotted on it.
  image_capture_id      BIGINT REFERENCES image_captures(image_capture_id) ON DELETE SET NULL,
  marker_x_pct          NUMERIC(5, 2) CHECK (marker_x_pct BETWEEN 0 AND 100),
  marker_y_pct          NUMERIC(5, 2) CHECK (marker_y_pct BETWEEN 0 AND 100),

  -- Evidence: photo of the moisture reader actually in position at this
  -- reading point (capture_kind = 'moisture_evidence').
  evidence_image_capture_id BIGINT REFERENCES image_captures(image_capture_id) ON DELETE SET NULL,

  -- Equipment provenance. technician_equipment_id is the structured FK
  -- the wizard writes to; instrument_model is kept as a deprecated
  -- free-text fallback for rows imported before the equipment tables
  -- existed (and for partner-lab imports that don't know our asset list).
  technician_equipment_id BIGINT REFERENCES technician_equipment(technician_equipment_id) ON DELETE SET NULL,
  instrument_model      TEXT,                                       -- 'Wagner Orion 940' (deprecated)
  depth_mm              NUMERIC(5, 2),                              -- 25

  measured_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX moisture_readings_location ON moisture_readings (sample_location_id);
CREATE INDEX moisture_readings_level    ON moisture_readings (level);
CREATE INDEX moisture_readings_image    ON moisture_readings (image_capture_id) WHERE image_capture_id IS NOT NULL;
CREATE INDEX moisture_readings_evidence  ON moisture_readings (evidence_image_capture_id) WHERE evidence_image_capture_id IS NOT NULL;
CREATE INDEX moisture_readings_equipment ON moisture_readings (technician_equipment_id) WHERE technician_equipment_id IS NOT NULL;


-- Location findings: narrative observation text per location.
-- Usually one row per location, but the table allows multiple ordered entries.
CREATE TABLE location_findings (
  finding_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_location_id  BIGINT NOT NULL REFERENCES sample_locations(sample_location_id) ON DELETE CASCADE,
  observation         TEXT NOT NULL,
  display_order       INTEGER NOT NULL DEFAULT 0,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX location_findings_location ON location_findings (sample_location_id);
ALTER TABLE location_findings
  ADD CONSTRAINT location_findings_order_uq UNIQUE (sample_location_id, display_order);
CREATE TRIGGER location_findings_updated_at
  BEFORE UPDATE ON location_findings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Location sources: ranked likely cause(s) per location.
CREATE TABLE location_sources (
  source_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_location_id  BIGINT NOT NULL REFERENCES sample_locations(sample_location_id) ON DELETE CASCADE,
  rank                TEXT   NOT NULL CHECK (rank IN ('primary', 'secondary', 'tertiary')),
  source_category     TEXT   NOT NULL CHECK (source_category IN (
                        'roof', 'walls', 'wet_area', 'plumbing', 'hvac',
                        'ventilation', 'drainage', 'subfloor', 'appliance',
                        'condensation', 'unknown'
                      )),
  description         TEXT NOT NULL,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX location_sources_location ON location_sources (sample_location_id);
CREATE INDEX location_sources_category ON location_sources (source_category);
ALTER TABLE location_sources
  ADD CONSTRAINT location_sources_order_uq UNIQUE (sample_location_id, display_order);


-- =====================================================================
-- AIR SAMPLE + LAB DATA  (one air_sample per sample_location)
-- =====================================================================

-- Air sample: a single lab-issued slide tied to one sample_location.
-- All counts roll up under here. Slide images live in storage; the lab PDF
-- is also kept for archival.
CREATE TABLE air_samples (
  air_sample_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_location_id       BIGINT NOT NULL UNIQUE REFERENCES sample_locations(sample_location_id) ON DELETE CASCADE,

  -- Lab provenance
  lab_partner              TEXT   NOT NULL DEFAULT 'lab',           -- multi-lab future; the row records which lab analysed the slide
  lab_sample_id            TEXT,
  sampled_at               TIMESTAMPTZ NOT NULL,
  received_by_lab_at       TIMESTAMPTZ,
  reported_by_lab_at       TIMESTAMPTZ,

  -- Slide images (Supabase Storage object keys)
  slide_trace_4x_outside_path TEXT,                                 -- "Trace 4x · Outside"
  slide_trace_4x_inside_path  TEXT,                                 -- "Trace 4x · Inside"
  slide_30x_zoomed_path       TEXT,                                 -- "30x Zoomed"

  -- Roll-ups (denormalised, but cheap to keep alongside the row)
  total_spores_per_m3         INTEGER CHECK (total_spores_per_m3 >= 0),
  dominant_fungal_classification_id BIGINT REFERENCES fungal_classifications(fungal_classification_id) ON DELETE RESTRICT,

  -- Archival
  lab_notes                TEXT,
  lab_pdf_storage_path     TEXT,

  -- Field evidence: intake-time photo of the canister with ID legible while
  -- the pump is running (capture_kind = 'air_evidence').
  intake_evidence_image_capture_id BIGINT REFERENCES image_captures(image_capture_id) ON DELETE SET NULL,

  -- Which pump / sampler unit this sample was taken with.
  technician_equipment_id  BIGINT REFERENCES technician_equipment(technician_equipment_id) ON DELETE SET NULL,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX air_samples_location    ON air_samples (sample_location_id);
CREATE INDEX air_samples_sampled_at  ON air_samples (sampled_at);
CREATE INDEX air_samples_lab_partner ON air_samples (lab_partner);
CREATE INDEX air_samples_dominant    ON air_samples (dominant_fungal_classification_id) WHERE dominant_fungal_classification_id IS NOT NULL;
CREATE INDEX air_samples_intake_evidence ON air_samples (intake_evidence_image_capture_id) WHERE intake_evidence_image_capture_id IS NOT NULL;
CREATE INDEX air_samples_equipment        ON air_samples (technician_equipment_id)        WHERE technician_equipment_id IS NOT NULL;
CREATE UNIQUE INDEX air_samples_lab_sample_uq
  ON air_samples (lab_partner, lab_sample_id) WHERE lab_sample_id IS NOT NULL;
CREATE TRIGGER air_samples_updated_at
  BEFORE UPDATE ON air_samples
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- One row per (air_sample, fungal_classification) — the full lab table.
-- Spores per m³. level captures the lab's editorial banding (yellow / red).
CREATE TABLE air_sample_fungal_counts (
  air_sample_fungal_count_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  air_sample_id              BIGINT NOT NULL REFERENCES air_samples(air_sample_id) ON DELETE CASCADE,
  fungal_classification_id   BIGINT NOT NULL REFERENCES fungal_classifications(fungal_classification_id) ON DELETE RESTRICT,
  spores_per_m3              INTEGER NOT NULL CHECK (spores_per_m3 >= 0),
  level                      TEXT CHECK (level IN ('normal', 'moderate', 'severe')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (air_sample_id, fungal_classification_id)
);
CREATE INDEX air_fungal_counts_sample        ON air_sample_fungal_counts (air_sample_id);
CREATE INDEX air_fungal_counts_classification ON air_sample_fungal_counts (fungal_classification_id);
CREATE INDEX air_fungal_counts_level         ON air_sample_fungal_counts (level) WHERE level IS NOT NULL;


-- One row per (air_sample, particulate_type) — non-fungal particulate counts
-- and size-bucket totals.
CREATE TABLE air_sample_particulate_counts (
  air_sample_particulate_count_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  air_sample_id                   BIGINT NOT NULL REFERENCES air_samples(air_sample_id) ON DELETE CASCADE,
  particulate_type_id             BIGINT NOT NULL REFERENCES particulate_types(particulate_type_id) ON DELETE RESTRICT,
  particles_per_m3                INTEGER NOT NULL CHECK (particles_per_m3 >= 0),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (air_sample_id, particulate_type_id)
);
CREATE INDEX air_particulate_counts_sample ON air_sample_particulate_counts (air_sample_id);
CREATE INDEX air_particulate_counts_type   ON air_sample_particulate_counts (particulate_type_id);


-- Notable objects: individual clipped/zoomed specimen images from the slide.
-- These are gold for future ML training data — keep both the image and the
-- structured FK to fungal_classifications / particulate_types when possible.
CREATE TABLE air_sample_notable_objects (
  notable_object_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  air_sample_id            BIGINT NOT NULL REFERENCES air_samples(air_sample_id) ON DELETE CASCADE,

  -- Identification: at most one of these is set; both can be NULL if free text only.
  fungal_classification_id BIGINT REFERENCES fungal_classifications(fungal_classification_id) ON DELETE RESTRICT,
  particulate_type_id      BIGINT REFERENCES particulate_types(particulate_type_id)         ON DELETE RESTRICT,
  label                    TEXT   NOT NULL,                       -- the lab's label text

  -- Image
  image_storage_path       TEXT   NOT NULL,
  display_order            INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (
    (fungal_classification_id IS NOT NULL AND particulate_type_id IS NULL)
    OR (fungal_classification_id IS NULL AND particulate_type_id IS NOT NULL)
    OR (fungal_classification_id IS NULL AND particulate_type_id IS NULL)
  )
);
CREATE INDEX notable_objects_sample       ON air_sample_notable_objects (air_sample_id);
CREATE INDEX notable_objects_fungal       ON air_sample_notable_objects (fungal_classification_id) WHERE fungal_classification_id IS NOT NULL;
CREATE INDEX notable_objects_particulate  ON air_sample_notable_objects (particulate_type_id)      WHERE particulate_type_id      IS NOT NULL;
ALTER TABLE air_sample_notable_objects
  ADD CONSTRAINT notable_objects_order_uq UNIQUE (air_sample_id, display_order);


-- =====================================================================
-- SCOPE OF WORKS + PARTNER MATCHING  (at inspection level)
-- =====================================================================

-- Scope items: technician-selected work the property needs. Whole-inspection,
-- NOT per-location. The set of distinct trade_category_ids on the inspection
-- is the matching key against partner_skills.
CREATE TABLE scope_items (
  scope_item_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id      BIGINT NOT NULL REFERENCES inspections(inspection_id)         ON DELETE CASCADE,
  trade_category_id  BIGINT NOT NULL REFERENCES trade_categories(trade_category_id) ON DELETE RESTRICT,
  scope_tier         TEXT   NOT NULL CHECK (scope_tier IN ('minor', 'moderate', 'major')),
  cost_min           NUMERIC(10, 2) CHECK (cost_min >= 0),
  cost_max           NUMERIC(10, 2) CHECK (cost_max >= 0),
  detail             TEXT NOT NULL,
  display_order      INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cost_min IS NULL OR cost_max IS NULL OR cost_max >= cost_min)
);
CREATE INDEX scope_items_inspection ON scope_items (inspection_id);
CREATE INDEX scope_items_trade      ON scope_items (trade_category_id);
ALTER TABLE scope_items
  ADD CONSTRAINT scope_items_order_uq UNIQUE (inspection_id, display_order);
CREATE TRIGGER scope_items_updated_at
  BEFORE UPDATE ON scope_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Partner organisations.
CREATE TABLE partner_organizations (
  partner_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT   NOT NULL,
  clerk_org_id   TEXT   UNIQUE,                                  -- Clerk Organization (nullable)
  contact_email  TEXT,
  contact_phone  TEXT,
  credentials    TEXT,                                            -- 'IICRC S520-trained · QBCC 1058219'
  service_areas  TEXT[] NOT NULL DEFAULT '{}',                   -- postcodes
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  rating         NUMERIC(2, 1) CHECK (rating BETWEEN 0 AND 5),
  reviews_count  INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX partners_active        ON partner_organizations (active) WHERE active;
CREATE INDEX partners_service_areas ON partner_organizations USING GIN (service_areas);
CREATE TRIGGER partner_organizations_updated_at
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Partner skills: which trades each partner can service. M2M with trade_categories.
CREATE TABLE partner_skills (
  partner_id         BIGINT NOT NULL REFERENCES partner_organizations(partner_id)   ON DELETE CASCADE,
  trade_category_id  BIGINT NOT NULL REFERENCES trade_categories(trade_category_id) ON DELETE RESTRICT,
  PRIMARY KEY (partner_id, trade_category_id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX partner_skills_trade ON partner_skills (trade_category_id);


-- Partner handoffs: introductions made for a given inspection.
-- One handoff per (inspection, partner). status tracks the lifecycle.
CREATE TABLE partner_handoffs (
  handoff_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id   BIGINT NOT NULL REFERENCES inspections(inspection_id)            ON DELETE CASCADE,
  partner_id      BIGINT NOT NULL REFERENCES partner_organizations(partner_id)     ON DELETE RESTRICT,
  status          TEXT   NOT NULL DEFAULT 'matched'
                   CHECK (status IN ('matched', 'introduced', 'quoted', 'engaged', 'declined')),
  notes           TEXT,
  introduced_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, partner_id)
);
CREATE INDEX handoffs_inspection ON partner_handoffs (inspection_id);
CREATE INDEX handoffs_partner    ON partner_handoffs (partner_id);
CREATE INDEX handoffs_status     ON partner_handoffs (status);
CREATE TRIGGER partner_handoffs_updated_at
  BEFORE UPDATE ON partner_handoffs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- SUBSCRIPTIONS (Sentinel · Stripe-backed)
-- =====================================================================

CREATE TABLE subscriptions (
  subscription_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id             BIGINT NOT NULL REFERENCES customers(customer_id)   ON DELETE RESTRICT,
  property_id             BIGINT NOT NULL REFERENCES properties(property_id)  ON DELETE RESTRICT,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'sentinel' CHECK (plan IN ('sentinel')),
  status                  TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'past_due', 'paused', 'cancelled')),
  weekly_amount           NUMERIC(8, 2) NOT NULL CHECK (weekly_amount >= 0),
  current_period_end      TIMESTAMPTZ,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_customer ON subscriptions (customer_id);
CREATE INDEX subscriptions_property ON subscriptions (property_id);
CREATE INDEX subscriptions_status   ON subscriptions (status);
-- Only one active sub per (customer, property) at any time; cancelled rows can stack.
CREATE UNIQUE INDEX subscriptions_one_active
  ON subscriptions (customer_id, property_id) WHERE status = 'active';
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- INTEGRATION / WEBHOOKS
-- =====================================================================

-- Idempotency + audit log for external webhook deliveries (Cal.com,
-- Stripe, ...). The handler inserts a row keyed by (provider, event_id)
-- BEFORE doing real work — the UNIQUE constraint guarantees a duplicate
-- delivery (provider retries on 5xx) becomes a no-op conflict instead
-- of double-processing the inspection state change. `event_id` is
-- whatever the provider gives us as a stable dedupe key (or computed
-- from the payload if they don't expose one — see /api/cal/webhook).
CREATE TABLE webhook_events (
  webhook_event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider         TEXT NOT NULL,                                 -- 'cal', 'stripe', ...
  event_id         TEXT NOT NULL,                                 -- provider's dedupe key
  event_type       TEXT NOT NULL,                                 -- 'BOOKING_CREATED' etc
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,                                   -- set when the handler completes
  error            TEXT,                                          -- set when the handler throws
  raw_payload      TEXT,                                          -- raw JSON body for debugging only

  UNIQUE (provider, event_id)
);
CREATE INDEX webhook_events_received_at ON webhook_events (received_at DESC);
CREATE INDEX webhook_events_unprocessed
  ON webhook_events (received_at) WHERE processed_at IS NULL;


-- =====================================================================
-- TODO before production
-- =====================================================================
--
--   1. Seed reference tables:
--        - trade_categories (the canonical list of trades you offer)
--        - particulate_types (Hypha, Pollen, ... + size totals)
--        - fungal_classifications (canonical list of species; classification_group
--          buckets each into: predominantly_outdoor / predominantly_indoor_water_related
--          / indoor_outdoor — drives the report's "is this normal for outdoor air?" framing)
--
--   2. Enable Supabase RLS and add policies. Sketch:
--        ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
--        CREATE POLICY inspections_own ON inspections FOR SELECT
--          USING (customer_id IN (
--            SELECT customer_id FROM customers
--            WHERE clerk_user_id = current_setting('request.jwt.claim.sub', true)
--          ));
--        CREATE POLICY inspections_public_report ON inspections FOR SELECT
--          USING (report_status = 'published' AND report_slug = current_setting('request.report_slug', true));
--      ...and similar for sample_locations / image_captures / etc.
--
--   3. Supabase Storage buckets (kept separate so retention / access can differ):
--        sporetrust-inspection-images   — image_captures.storage_path
--        sporetrust-air-sample-slides   — air_samples.slide_*_path
--        sporetrust-notable-objects     — air_sample_notable_objects.image_storage_path
--        sporetrust-lab-pdfs            — air_samples.lab_pdf_storage_path
--
--   4. (Future, not setup) The structured-everywhere design + per-row
--      timestamps means a depersonalised export view set is straightforward
--      when there's an actual analytics / insurance need. Strip customer
--      PII (name, email, phone, clerk_user_id, stripe_customer_id); keep
--      the address — it IS the reconciliation key.
-- =====================================================================
