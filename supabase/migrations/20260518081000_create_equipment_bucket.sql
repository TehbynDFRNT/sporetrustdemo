-- Bucket for equipment catalogue images (one image per equipment_type
-- used for card-based identification in the wizard's kit-confirm flow).
-- Public for the same reason inspection-images is — we can tighten and
-- swap to signed URLs later without a schema change.
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

COMMIT;
