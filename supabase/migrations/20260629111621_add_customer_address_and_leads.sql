-- Customer address + geocode (was missing — a lead has a location before any
-- property/inspection exists), and a leads table for paid-funnel capture.
BEGIN;

-- Address-on-file + geocode for the customer. Captured at first touch (the
-- lead form). The SPECIFIC inspected address still lives on properties, per
-- inspection — these are the customer's contact address, populated for leads
-- that never reach a booking.
ALTER TABLE customers
  ADD COLUMN address_line    TEXT,
  ADD COLUMN postcode        TEXT,
  ADD COLUMN state           TEXT DEFAULT 'QLD',
  ADD COLUMN google_place_id TEXT,
  ADD COLUMN lat             NUMERIC(9, 6),
  ADD COLUMN lng             NUMERIC(9, 6);

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

  -- Attribution (the paid-media data with no other home)
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

COMMIT;
