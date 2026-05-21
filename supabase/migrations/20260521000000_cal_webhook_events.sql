-- Cal.com webhook integration: persist every delivery for idempotency +
-- audit. The webhook handler inserts a row keyed by (provider, event_id)
-- BEFORE doing any real work — the UNIQUE constraint guarantees a
-- duplicate delivery (Cal retries on 5xx) becomes a no-op insert
-- conflict instead of double-processing the inspection state change.
--
-- `event_id` is computed from the payload (triggerEvent + bookingUid +
-- createdAt) since Cal v2 webhooks don't include a dedicated delivery
-- identifier in the header set we receive. Same delivery retried by Cal
-- carries the same body and therefore the same computed event_id.

CREATE TABLE webhook_events (
  webhook_event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider         TEXT NOT NULL,                                 -- 'cal'
  event_id         TEXT NOT NULL,                                 -- dedupe key (see header note)
  event_type       TEXT NOT NULL,                                 -- 'BOOKING_CREATED' etc
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  error            TEXT,                                          -- set when the handler throws
  raw_payload      TEXT,                                          -- raw JSON body for debugging only

  UNIQUE (provider, event_id)
);

CREATE INDEX webhook_events_received_at ON webhook_events (received_at DESC);
CREATE INDEX webhook_events_unprocessed
  ON webhook_events (received_at) WHERE processed_at IS NULL;
