-- Equipment as a typed, technician-owned asset.
--
-- Three tables + a few FKs make the field SOP a lot cleaner:
--
--   equipment_types        — the catalogue (Wagner Orion 940, FLIR C5, …).
--                            Each carries an image_storage_path so the
--                            wizard can render card-based identification.
--   technician_equipment   — each tech's personal kit (asset_tag, serial).
--                            One row per physical instrument they own.
--   inspection_equipment   — which of a tech's kit they've checked off
--                            for THIS inspection (the "today's kit" gate).
--
-- Two new FKs let us replace free-text instrument fields with structured
-- references:
--   moisture_readings.technician_equipment_id  (was instrument_model TEXT)
--   air_samples.technician_equipment_id
--
-- Plus a one-line addition on inspections:
--   inspections.kit_confirmed_at  — set when the tech confirms today's kit
--                                   (the inspection landing page gates on this).
BEGIN;

CREATE TABLE equipment_types (
  equipment_type_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  manufacturer       TEXT,
  category           TEXT NOT NULL CHECK (category IN (
                       'moisture_meter', 'thermal_camera', 'air_sampler',
                       'particle_counter', 'hygrometer', 'other'
                     )),
  image_storage_path TEXT,
  notes              TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX equipment_types_category ON equipment_types (category);
CREATE INDEX equipment_types_active   ON equipment_types (active) WHERE active;
CREATE TRIGGER equipment_types_updated_at
  BEFORE UPDATE ON equipment_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE technician_equipment (
  technician_equipment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  technician_id           BIGINT NOT NULL REFERENCES technicians(technician_id) ON DELETE CASCADE,
  equipment_type_id       BIGINT NOT NULL REFERENCES equipment_types(equipment_type_id) ON DELETE RESTRICT,
  asset_tag               TEXT,
  serial                  TEXT,
  acquired_at             DATE,
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX technician_equipment_tech ON technician_equipment (technician_id);
CREATE INDEX technician_equipment_type ON technician_equipment (equipment_type_id);
CREATE INDEX technician_equipment_active ON technician_equipment (active) WHERE active;
CREATE UNIQUE INDEX technician_equipment_asset_uq
  ON technician_equipment (technician_id, asset_tag) WHERE asset_tag IS NOT NULL;
CREATE TRIGGER technician_equipment_updated_at
  BEFORE UPDATE ON technician_equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Pure join. (inspection_id, technician_equipment_id) is the PK so the
-- "checkbox" semantics map exactly to an INSERT / DELETE.
CREATE TABLE inspection_equipment (
  inspection_id            BIGINT NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
  technician_equipment_id  BIGINT NOT NULL REFERENCES technician_equipment(technician_equipment_id) ON DELETE CASCADE,
  added_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (inspection_id, technician_equipment_id)
);
CREATE INDEX inspection_equipment_tech_eq ON inspection_equipment (technician_equipment_id);


-- Equipment chosen per moisture reading. instrument_model stays for now as
-- a deprecated free-text fallback; new wizard writes prefer the FK.
ALTER TABLE moisture_readings
  ADD COLUMN technician_equipment_id BIGINT
    REFERENCES technician_equipment(technician_equipment_id) ON DELETE SET NULL;
CREATE INDEX moisture_readings_equipment
  ON moisture_readings (technician_equipment_id)
  WHERE technician_equipment_id IS NOT NULL;


-- Equipment chosen for the air sample's pump / sampler unit.
ALTER TABLE air_samples
  ADD COLUMN technician_equipment_id BIGINT
    REFERENCES technician_equipment(technician_equipment_id) ON DELETE SET NULL;
CREATE INDEX air_samples_equipment
  ON air_samples (technician_equipment_id)
  WHERE technician_equipment_id IS NOT NULL;


-- "Today's kit" gate. NULL = the tech still needs to confirm.
ALTER TABLE inspections
  ADD COLUMN kit_confirmed_at TIMESTAMPTZ;
CREATE INDEX inspections_kit_confirmed
  ON inspections (kit_confirmed_at)
  WHERE kit_confirmed_at IS NOT NULL;

COMMIT;
