-- Scrub the brand-named "sporecyte" references the early seed migrations
-- baked into the live data. Generic placeholders only — the lab partner
-- isn't decided yet, so we don't want a specific name floating in the
-- customer-facing report.
BEGIN;

-- 1. Default value on the column (so freshly-inserted air_samples don't
-- inherit the old brand name).
ALTER TABLE air_samples ALTER COLUMN lab_partner SET DEFAULT 'lab';

-- 2. Existing rows: rename lab_partner + the demo lab_sample_id / pdf paths
-- that carried "SPC-" / "sporecyte-rpt-" tokens.
UPDATE air_samples SET lab_partner = 'lab'
  WHERE lab_partner = 'sporecyte';
UPDATE air_samples SET lab_sample_id = REPLACE(lab_sample_id, 'SPC-', 'LAB-')
  WHERE lab_sample_id LIKE 'SPC-%';
UPDATE air_samples SET lab_pdf_storage_path = REPLACE(lab_pdf_storage_path, 'sporecyte-rpt-', 'lab-rpt-')
  WHERE lab_pdf_storage_path LIKE '%sporecyte-rpt-%';

-- 3. Equipment row that was named after the lab partner.
UPDATE equipment_types
SET slug         = 'cassette-air-sampler',
    name         = 'Cassette air sampler',
    manufacturer = NULL,
    notes        = 'Calibrated cassette pump for the lab partner''s slide format; pulls 75 L/min.'
WHERE slug = 'sporecyte-cassette-sampler';

-- 4. Fungal-classifications glossary citations — drop the URLs entirely;
-- the customer-facing report doesn't surface them, and the URL was
-- pointing at a specific lab partner's glossary.
UPDATE fungal_classifications SET source_url = NULL
  WHERE source_url LIKE '%sporecyte%';

COMMIT;
