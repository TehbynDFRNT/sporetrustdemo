-- A published report must carry a qualified-technician sign-off.
-- Applied AFTER the reseed has populated the signoff columns for any
-- existing published rows.
BEGIN;

ALTER TABLE inspections
  ADD CONSTRAINT inspections_published_requires_signoff CHECK (
    report_status <> 'published'
    OR (signed_off_by_technician_id IS NOT NULL AND signed_off_at IS NOT NULL)
  );

COMMIT;
