-- Inspections gain a dedicated `report_title` column distinct from
-- `report_summary`. The title is the inspection-level headline (what + where);
-- the summary is the reviewer's narrative paragraph beneath it. Previously the
-- summary alone was carrying both jobs, which made it read like a per-room
-- finding instead of a report-wide framing.

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS report_title TEXT;

-- Backfill the seeded published inspection so the existing demo report
-- renders with both a title and a summary that read at the right level.
UPDATE inspections
   SET report_title = 'Localised condensation in Bedroom 1',
       report_summary = 'One moderate finding in Bedroom 1: surface condensation behind the SE wall cavity, driven by a cold bridge at the brickwork and weak sub-floor ventilation. Cleanup is straightforward once the underlying source is interrupted.'
 WHERE inspection_id = 1;
