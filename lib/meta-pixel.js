/* Meta Pixel browser wrapper (offline queue + per-event dedup + CAPI mirror).

   Ported from MFPProposalViewer/src/lib/meta-pixel.ts (types stripped). Each
   standard-event helper fires the browser Pixel; pair it with mirrorServerEvent
   using the SAME eventId so Meta dedupes the browser + server copies into one.
   Added: schedule() for appointment bookings. */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const TRACKED_EVENT_IDS_KEY = "sporetrust_meta_tracked_event_ids_v1";
const RECENT_EVENT_TTL_MS = 15000;

const pendingPixelEvents = [];
const recentBrowserEventTimes = new Map();
const recentServerMirrorTimes = new Map();
const inFlightServerMirrors = new Map();

const isFbqAvailable = () =>
  typeof window !== "undefined" && typeof window.fbq === "function";

const getRecentEventKey = (channel, eventName, eventId) =>
  eventId ? `${channel}:${eventName}:${eventId}` : undefined;

const pruneRecentEventMap = (eventMap) => {
  const cutoff = Date.now() - RECENT_EVENT_TTL_MS;
  for (const [key, ts] of eventMap.entries()) {
    if (ts < cutoff) eventMap.delete(key);
  }
};

const hasRecentlySentEvent = (eventMap, channel, eventName, eventId) => {
  const key = getRecentEventKey(channel, eventName, eventId);
  if (!key) return false;
  pruneRecentEventMap(eventMap);
  const lastSentAt = eventMap.get(key);
  return typeof lastSentAt === "number" && Date.now() - lastSentAt < RECENT_EVENT_TTL_MS;
};

const markEventRecentlySent = (eventMap, channel, eventName, eventId) => {
  const key = getRecentEventKey(channel, eventName, eventId);
  if (!key) return;
  pruneRecentEventMap(eventMap);
  eventMap.set(key, Date.now());
};

const sanitizeEventData = (data) =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null));

const queuePendingPixelEvent = (event) => {
  pendingPixelEvents.push(event);
};

export const generateEventId = (prefix = "") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

const firePageView = ({ params = {}, eventId } = {}) => {
  if (hasRecentlySentEvent(recentBrowserEventTimes, "browser", "PageView", eventId)) return;
  const eventData = sanitizeEventData(params);
  const options = eventId ? { eventID: eventId } : undefined;
  window.fbq("track", "PageView", eventData, options);
  markEventRecentlySent(recentBrowserEventTimes, "browser", "PageView", eventId);
};

const getTrackedEventIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.sessionStorage.getItem(TRACKED_EVENT_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const markEventIdTracked = (eventId) => {
  if (typeof window === "undefined") return;
  const tracked = new Set(getTrackedEventIds());
  tracked.add(eventId);
  window.sessionStorage.setItem(TRACKED_EVENT_IDS_KEY, JSON.stringify([...tracked]));
};

const hasTrackedEventId = (eventId) => {
  if (!eventId) return false;
  return getTrackedEventIds().includes(eventId);
};

const fireStandardEvent = ({ eventName, params = {}, eventId, once = false }) => {
  if (hasRecentlySentEvent(recentBrowserEventTimes, "browser", eventName, eventId)) return;
  if (once && hasTrackedEventId(eventId)) return;
  const eventData = sanitizeEventData(params);
  const options = eventId ? { eventID: eventId } : undefined;
  window.fbq("track", eventName, eventData, options);
  markEventRecentlySent(recentBrowserEventTimes, "browser", eventName, eventId);
  if (once && eventId) markEventIdTracked(eventId);
};

const fireCustomEvent = ({ eventName, params = {} }) => {
  window.fbq("trackCustom", eventName, sanitizeEventData(params));
};

export const flushPendingPixelEvents = () => {
  if (!isFbqAvailable() || pendingPixelEvents.length === 0) return;
  const toFlush = pendingPixelEvents.splice(0, pendingPixelEvents.length);
  toFlush.forEach((event) => {
    if (event.type === "pageview") {
      firePageView({ params: event.params, eventId: event.eventId });
      return;
    }
    if (event.type === "trackCustom") {
      fireCustomEvent({ eventName: event.eventName, params: event.params });
      return;
    }
    fireStandardEvent({
      eventName: event.eventName,
      params: event.params,
      eventId: event.eventId,
      once: event.once,
    });
  });
};

export const pageview = ({ eventId, params = {} } = {}) => {
  if (!META_PIXEL_ID) return;
  if (isFbqAvailable()) {
    firePageView({ eventId, params });
    return;
  }
  queuePendingPixelEvent({ type: "pageview", eventId, params });
};

export const getInitialPageViewEventId = () => {
  if (typeof window === "undefined") return undefined;
  return window.__sporetrustInitialPageViewEventId;
};

const trackStandardEvent = ({ eventName, params = {}, eventId, once = false }) => {
  if (!META_PIXEL_ID) return;
  if (!isFbqAvailable()) {
    queuePendingPixelEvent({ type: "track", eventName, params, eventId, once });
    return;
  }
  fireStandardEvent({ eventName, params, eventId, once });
};

export const event = (name, params = {}) => {
  if (isFbqAvailable()) {
    window.fbq("track", name, sanitizeEventData(params));
  } else {
    queuePendingPixelEvent({ type: "track", eventName: name, params });
  }
};

/* Non-standard events (quiz funnel steps etc.) must go through fbq's
   trackCustom verb — "track" is reserved for the standard event catalogue. */
export const trackCustom = (name, params = {}) => {
  if (!META_PIXEL_ID) return;
  if (isFbqAvailable()) {
    fireCustomEvent({ eventName: name, params });
    return;
  }
  queuePendingPixelEvent({ type: "trackCustom", eventName: name, params });
};

export const mirrorServerEvent = async ({
  eventName,
  eventId,
  customData = {},
  user = {},
  eventSourceUrl,
}) => {
  if (typeof window === "undefined") return;
  if (hasRecentlySentEvent(recentServerMirrorTimes, "server", eventName, eventId)) return;

  const inFlightKey = getRecentEventKey("server", eventName, eventId);
  if (inFlightKey) {
    const existing = inFlightServerMirrors.get(inFlightKey);
    if (existing) return existing;
  }

  try {
    const mirrorRequest = fetch("/api/meta-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: eventSourceUrl ?? window.location.href,
        customData,
        user,
      }),
    });
    if (inFlightKey) inFlightServerMirrors.set(inFlightKey, mirrorRequest.then(() => undefined));
    const response = await mirrorRequest;
    if (!response.ok) throw new Error(`Mirror route returned ${response.status}`);
    markEventRecentlySent(recentServerMirrorTimes, "server", eventName, eventId);
  } catch (error) {
    console.warn(`[FB Pixel] Failed to mirror ${eventName} to server`, error);
  } finally {
    if (inFlightKey) inFlightServerMirrors.delete(inFlightKey);
  }
};

const standardParams = ({ value, currency = "AUD", contentName, contentCategory, customData = {} }) => ({
  value,
  currency: value !== undefined ? currency : undefined,
  content_name: contentName,
  content_category: contentCategory,
  ...customData,
});

export const lead = (opts = {}) =>
  trackStandardEvent({ eventName: "Lead", params: standardParams(opts), eventId: opts.eventId });

export const viewContent = (opts = {}) =>
  trackStandardEvent({ eventName: "ViewContent", params: standardParams(opts), eventId: opts.eventId });

export const completeRegistration = (opts = {}) =>
  trackStandardEvent({
    eventName: "CompleteRegistration",
    params: standardParams(opts),
    eventId: opts.eventId,
    once: opts.once ?? true,
  });

export const schedule = (opts = {}) =>
  trackStandardEvent({
    eventName: "Schedule",
    params: standardParams(opts),
    eventId: opts.eventId,
    once: opts.once ?? false,
  });

export const contact = (opts = {}) =>
  trackStandardEvent({
    eventName: "Contact",
    params: standardParams(opts),
    eventId: opts.eventId,
    once: opts.once ?? false,
  });

export { META_PIXEL_ID };
