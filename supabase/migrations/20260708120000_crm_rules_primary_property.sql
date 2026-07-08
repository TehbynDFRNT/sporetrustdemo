-- CRM cards gain a denormalised primary_property_id — the one address the
-- rules engine and card UI treat as "the" property for a card. Kept fresh at
-- runtime by the lead API (fill-if-empty) and the booking flow (booking wins,
-- unconditional). NULL until a property is linked.
ALTER TABLE crm_cards
  ADD COLUMN primary_property_id BIGINT REFERENCES properties(property_id) ON DELETE SET NULL;

CREATE INDEX crm_cards_primary_property
  ON crm_cards (primary_property_id) WHERE primary_property_id IS NOT NULL;

-- Backfill: for each card, pick its customer's property — prefer a 'booking'
-- link, else the earliest-created link.
UPDATE crm_cards c
SET primary_property_id = (
  SELECT cp.property_id
  FROM customer_properties cp
  WHERE cp.customer_id = c.customer_id
  ORDER BY (cp.source = 'booking') DESC, cp.created_at ASC
  LIMIT 1
)
WHERE c.primary_property_id IS NULL;
