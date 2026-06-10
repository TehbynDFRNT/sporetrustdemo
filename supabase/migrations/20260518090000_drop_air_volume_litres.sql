-- Drop air_samples.air_volume_litres. The field has been removed from the
-- wizard — sampler kit + sampled_at carry the provenance the wizard now
-- captures, and the pump flow rate is a constant of the sampler model anyway
-- (computed from sampled_at duration if it ever needs to be derived).
-- This drops the column AND any data it carried.
BEGIN;

ALTER TABLE air_samples DROP COLUMN IF EXISTS air_volume_litres;

COMMIT;
