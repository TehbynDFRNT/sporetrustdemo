-- Storage bucket for inspection-time image_captures (visible + thermal pairs,
-- moisture-reader evidence shots, air-sample canister evidence).
--
-- Storage paths are written into image_captures.storage_path /
-- moisture_readings.<evidence> / air_samples.* by the technician wizard. The
-- bucket is left non-public for now; the admin app signs URLs server-side
-- when it needs to render an image. Flip to `public = true` here if you want
-- direct CDN URLs during early iteration.
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-images', 'inspection-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

COMMIT;
