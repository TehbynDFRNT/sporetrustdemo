-- Enforce that display_order is unique within its parent scope.
-- Schema intent: display_order means "position within the parent group" —
-- not a global sort key. Without these UNIQUE constraints there's nothing
-- stopping two siblings from claiming the same slot.

BEGIN;

ALTER TABLE trade_categories
  ADD CONSTRAINT trade_categories_group_order_uq UNIQUE (group_label, display_order);

ALTER TABLE particulate_types
  ADD CONSTRAINT particulate_types_order_uq UNIQUE (display_order);

ALTER TABLE sample_locations
  ADD CONSTRAINT sample_locations_order_uq UNIQUE (inspection_id, display_order);

ALTER TABLE location_findings
  ADD CONSTRAINT location_findings_order_uq UNIQUE (sample_location_id, display_order);

ALTER TABLE location_sources
  ADD CONSTRAINT location_sources_order_uq UNIQUE (sample_location_id, display_order);

ALTER TABLE air_sample_notable_objects
  ADD CONSTRAINT notable_objects_order_uq UNIQUE (air_sample_id, display_order);

ALTER TABLE scope_items
  ADD CONSTRAINT scope_items_order_uq UNIQUE (inspection_id, display_order);

COMMIT;
