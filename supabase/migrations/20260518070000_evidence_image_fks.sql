-- Evidence-image FKs for the inspection-workspace SOP.
--
-- Two things need to be captured at field time that the v1 schema didn't
-- model:
--
--   1. A moisture_reading should carry photographic evidence of the moisture
--      reader in position. This is *separate* from the pin overlay (where
--      image_capture_id + marker_x_pct/y_pct point the reading at the wide
--      visible reference shot taken in Step 2).
--
--   2. An air_sample should carry an intake-time evidence photo — the
--      canister with its ID legible while the pump is running.
--
-- Approach:
--   * Widen image_captures.capture_kind to include 'moisture_evidence' and
--     'air_evidence' so the existing image-upload pipeline (and storage
--     bucket) handles them with no extra plumbing.
--   * Add nullable FKs on the consuming rows.
BEGIN;

ALTER TABLE image_captures DROP CONSTRAINT image_captures_capture_kind_check;
ALTER TABLE image_captures
  ADD CONSTRAINT image_captures_capture_kind_check
  CHECK (capture_kind IN ('visible', 'thermal', 'moisture_evidence', 'air_evidence'));

ALTER TABLE moisture_readings
  ADD COLUMN evidence_image_capture_id BIGINT
    REFERENCES image_captures(image_capture_id) ON DELETE SET NULL;
CREATE INDEX moisture_readings_evidence
  ON moisture_readings (evidence_image_capture_id)
  WHERE evidence_image_capture_id IS NOT NULL;

ALTER TABLE air_samples
  ADD COLUMN intake_evidence_image_capture_id BIGINT
    REFERENCES image_captures(image_capture_id) ON DELETE SET NULL;
CREATE INDEX air_samples_intake_evidence
  ON air_samples (intake_evidence_image_capture_id)
  WHERE intake_evidence_image_capture_id IS NOT NULL;

COMMIT;
