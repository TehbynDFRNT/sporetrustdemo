import crypto from "node:crypto";

// Server-side Conversions API helper. Receives un-hashed PII from the browser
// mirror, SHA-256-hashes it (Meta requires hashed em/ph/fn/ln/ct/st/zp/country/
// external_id; fbp/fbc/IP/UA stay raw), and forwards to the Graph API with the
// shared event_id so Meta deduplicates the browser Pixel + this server copy.
// Ported from MFPProposalViewer/src/lib/meta-capi.ts.

const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN =
  process.env.META_CAPI_ACCESS_TOKEN ||
  process.env.META_CONVERSIONS_API_ACCESS_TOKEN ||
  process.env.META_ACCESS_TOKEN;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const GRAPH_VERSION = "v23.0";

const normalizeEmail = (email) => {
  if (!email) return undefined;
  return email.trim().toLowerCase() || undefined;
};

// AU-specific: 0… → 61…
const normalizePhone = (phone) => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("61")) return digits;
  if (digits.startsWith("0") && digits.length >= 9) return `61${digits.slice(1)}`;
  return digits;
};

const normalizeName = (value) => {
  if (!value) return undefined;
  return String(value).trim().toLowerCase() || undefined;
};

const normalizeZip = (zip) => {
  if (!zip) return undefined;
  return String(zip).replace(/\s+/g, "").toLowerCase() || undefined;
};

const sha256 = (value) => {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value).digest("hex");
};

const sanitizeObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

const buildUserData = (user) =>
  sanitizeObject({
    em: sha256(normalizeEmail(user.email)),
    ph: sha256(normalizePhone(user.phone)),
    fn: sha256(normalizeName(user.firstName)),
    ln: sha256(normalizeName(user.lastName)),
    ct: sha256(normalizeName(user.city)),
    st: sha256(normalizeName(user.state)),
    zp: sha256(normalizeZip(user.zip)),
    country: sha256(normalizeName(user.country)),
    external_id: sha256(user.externalId ? String(user.externalId).trim() : undefined),
    fbp: user.fbp,
    fbc: user.fbc,
    client_ip_address: user.clientIpAddress,
    client_user_agent: user.clientUserAgent,
  });

const buildBody = (event) =>
  sanitizeObject({
    data: [
      sanitizeObject({
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: buildUserData(event.user || {}),
        custom_data: sanitizeObject(event.customData ?? {}),
      }),
    ],
    test_event_code: META_TEST_EVENT_CODE,
  });

export const isMetaCapiConfigured = () => Boolean(META_PIXEL_ID && META_CAPI_ACCESS_TOKEN);

export async function sendMetaCapiEvent(event) {
  if (!isMetaCapiConfigured()) {
    console.warn("[Meta CAPI] Missing pixel id or access token, skipping event", {
      eventName: event.eventName,
    });
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_CAPI_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(buildBody(event)),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`[Meta CAPI] Failed to send ${event.eventName}: ${response.status} ${errorBody}`);
  }
}
