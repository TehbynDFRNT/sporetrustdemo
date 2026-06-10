-- Storage bucket for lab-returned air-sample slide images
-- (slide_trace_4x_outside_path / slide_trace_4x_inside_path /
-- slide_30x_zoomed_path on air_samples). Public for now to match the
-- inspection-images and equipment-images conventions; flip to private +
-- signed URLs when we tighten the public-report access pattern.
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('air-slides', 'air-slides', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

COMMIT;
