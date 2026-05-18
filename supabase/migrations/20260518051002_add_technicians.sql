-- Service technicians + qualified-technician sign-off on inspections.
BEGIN;

CREATE TABLE technicians (
  technician_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_user_id  TEXT UNIQUE,
  email          TEXT NOT NULL,
  name           TEXT NOT NULL,
  phone          TEXT,
  role           TEXT NOT NULL DEFAULT 'field'
                   CHECK (role IN ('field', 'qualified', 'admin')),
  qualifications TEXT,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX technicians_email_lower_uq ON technicians (LOWER(email));
CREATE INDEX technicians_role   ON technicians (role);
CREATE INDEX technicians_active ON technicians (active) WHERE active;
CREATE TRIGGER technicians_updated_at
  BEFORE UPDATE ON technicians
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Replace free-text inspector_name with a real FK.
ALTER TABLE inspections DROP COLUMN inspector_name;
ALTER TABLE inspections
  ADD COLUMN technician_id BIGINT REFERENCES technicians(technician_id) ON DELETE RESTRICT,
  ADD COLUMN signed_off_by_technician_id BIGINT REFERENCES technicians(technician_id) ON DELETE RESTRICT,
  ADD COLUMN signed_off_at TIMESTAMPTZ;

CREATE INDEX inspections_technician ON inspections (technician_id)            WHERE technician_id IS NOT NULL;
CREATE INDEX inspections_signoff    ON inspections (signed_off_by_technician_id) WHERE signed_off_by_technician_id IS NOT NULL;

-- The published-requires-signoff CHECK is added in a later migration
-- after the reseed has populated the new signoff columns on existing
-- published rows (otherwise this constraint would reject them).

COMMIT;
