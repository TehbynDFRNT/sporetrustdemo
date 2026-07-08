-- CRM layer: pipeline cards (one per customer), touchpoints (timeline +
-- action queue in one table), and customer↔property linkage so properties
-- populate from leads, not just bookings. Backfills from existing data.
BEGIN;

-- =====================================================================
-- CRM: cards — one per customer, the deduped pipeline anchor.
-- Leads stay append-only enquiry events; pipeline state lives here.
-- Stage labels/order/hints are config-driven in lib/crm/stages.js; the
-- CHECK pins the slugs only.
-- =====================================================================
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


-- =====================================================================
-- CRM: touchpoints — the card's timeline AND the outbound action queue.
-- Queue lifecycle: draft → approved → sending → sent → delivered|failed.
-- Completed manual entries (calls, notes, inbound) land as 'logged';
-- rejected suggestions as 'cancelled'. The 'sending' claim is atomic
-- (UPDATE ... WHERE status IN ('draft','approved') RETURNING) so a
-- touchpoint can never double-send.
-- =====================================================================
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
-- Customer ↔ property linkage. Properties stay identity-only; the
-- relationship (who enquired/booked about the address, and as what)
-- lives on the join. Lets lead addresses populate properties without
-- waiting for a booking.
-- =====================================================================
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


-- =====================================================================
-- Backfill from existing data (all idempotent)
-- =====================================================================

-- 1. A card for every customer that has at least one lead.
INSERT INTO crm_cards (customer_id)
SELECT DISTINCT customer_id FROM leads
ON CONFLICT (customer_id) DO NOTHING;

-- 2. Properties from customers' address-on-file (lead-captured addresses).
--    A customer address with the same google_place_id as an existing
--    property IS that property (booking-created addresses differ textually
--    from Places-formatted lead addresses) — skip those instead of
--    colliding with properties_place_id_uq. Dedupe place ids within the
--    selection too (first customer keeps it).
WITH candidates AS (
  SELECT c.address_line, c.postcode, COALESCE(c.state, 'QLD') AS state,
         CASE
           WHEN c.google_place_id IS NULL THEN NULL
           WHEN EXISTS (SELECT 1 FROM properties p WHERE p.google_place_id = c.google_place_id) THEN NULL
           WHEN ROW_NUMBER() OVER (PARTITION BY c.google_place_id ORDER BY c.customer_id) > 1 THEN NULL
           ELSE c.google_place_id
         END AS google_place_id,
         c.lat, c.lng
  FROM customers c
  WHERE c.address_line IS NOT NULL AND c.postcode IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM properties p
      WHERE c.google_place_id IS NOT NULL AND p.google_place_id = c.google_place_id
    )
)
INSERT INTO properties (address_line, postcode, state, google_place_id, lat, lng)
SELECT address_line, postcode, state, google_place_id, lat, lng FROM candidates
ON CONFLICT ((LOWER(address_line)), postcode) DO NOTHING;

-- 3a. Link customers to properties matched from their address-on-file —
--     by place id first (authoritative), then by natural key.
INSERT INTO customer_properties (customer_id, property_id, relationship, source)
SELECT DISTINCT ON (c.customer_id, p.property_id)
       c.customer_id, p.property_id,
       CASE c.customer_type WHEN 'property_manager' THEN 'manager' ELSE 'unknown' END,
       'lead'
FROM customers c
JOIN properties p
  ON (c.google_place_id IS NOT NULL AND p.google_place_id = c.google_place_id)
  OR (LOWER(p.address_line) = LOWER(c.address_line) AND p.postcode = c.postcode)
WHERE c.address_line IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3b. Link customers to properties they've booked inspections at.
INSERT INTO customer_properties (customer_id, property_id, relationship, source)
SELECT DISTINCT i.customer_id, i.property_id, 'unknown', 'booking'
FROM inspections i
ON CONFLICT (customer_id, property_id) DO UPDATE SET source = 'booking';

COMMIT;
