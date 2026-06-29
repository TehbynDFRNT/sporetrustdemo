/* Meta identity / journey helpers (browser).

   Reads fbp/fbc/fbclid, keeps a sessionStorage identity cache that survives
   navigation, and assembles the UN-HASHED user_data the server (lib/meta-capi)
   will hash. Ported from MFPProposalViewer/src/lib/meta-funnel.ts, trimmed to
   the core (the pool-specific funnel-context machinery isn't needed here). */

export const META_JOURNEY_CACHE_KEY = "sporetrust_meta_journey_v1";

export const generateMetaSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getCookieValue = (name) => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;
};

const normalizeString = (value) => {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
};

const normalizeEmail = (value) => normalizeString(value)?.toLowerCase();

const sanitizeAddressValue = (value) => normalizeString(value)?.replace(/\s+/g, " ");

const readMetaJourneyCache = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(META_JOURNEY_CACHE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const writeMetaJourneyCache = (cache) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(META_JOURNEY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore storage write errors */
  }
};

const getOrCreateMetaSessionId = (existing) => {
  if (typeof window === "undefined") return normalizeString(existing);
  return normalizeString(existing) || generateMetaSessionId();
};

const mergeMetaBrowserIdentifiers = (...sources) => {
  const merged = {};
  for (const source of sources) {
    const fbclid = normalizeString(source?.fbclid);
    const fbp = normalizeString(source?.fbp);
    const fbc = normalizeString(source?.fbc);
    if (fbclid) merged.fbclid = fbclid;
    if (fbp) merged.fbp = fbp;
    if (fbc) merged.fbc = fbc;
  }
  return merged;
};

// "12 Smith St, Brisbane QLD 4000, Australia" → {city, state, zip, country}
export const parseAustralianAddressIdentity = (address) => {
  const normalized = sanitizeAddressValue(address);
  if (!normalized) return {};
  const parts = normalized.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { address: normalized };

  const countryPart = parts.at(-1);
  const hasCountry = countryPart ? /^(australia|au)$/i.test(countryPart) : false;
  const locationPart = hasCountry ? parts.at(-2) : parts.at(-1);
  const streetParts = hasCountry ? parts.slice(0, -2) : parts.slice(0, -1);
  const localityMatch = locationPart?.match(/^(.*?)\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})$/i);

  return {
    address: normalized,
    city: localityMatch?.[1]?.trim(),
    state: localityMatch?.[2]?.toUpperCase(),
    zip: localityMatch?.[3],
    country: hasCountry ? "Australia" : streetParts.length > 0 ? "Australia" : undefined,
  };
};

export const mergeMetaIdentity = (...sources) => {
  const merged = {};
  for (const source of sources) {
    if (!source) continue;
    const normalizedSource = {
      email: normalizeEmail(source.email),
      phone: normalizeString(source.phone),
      firstName: normalizeString(source.firstName),
      lastName: normalizeString(source.lastName),
      address: sanitizeAddressValue(source.address),
      city: normalizeString(source.city),
      state: normalizeString(source.state)?.toUpperCase(),
      zip: normalizeString(source.zip),
      country: normalizeString(source.country),
      placeId: normalizeString(source.placeId),
      externalId: normalizeString(source.externalId),
    };
    const parsed = parseAustralianAddressIdentity(normalizedSource.address);
    const enriched = {
      ...parsed,
      ...normalizedSource,
      city: normalizedSource.city || parsed.city,
      state: normalizedSource.state || parsed.state,
      zip: normalizedSource.zip || parsed.zip,
      country: normalizedSource.country || parsed.country,
    };
    for (const [key, value] of Object.entries(enriched)) {
      if (value) merged[key] = value;
    }
  }
  return merged;
};

export const buildMetaIdentity = (identity = {}) => mergeMetaIdentity(identity);

export const getMetaJourneyCache = () => readMetaJourneyCache();

export const upsertMetaJourneyCache = ({ sessionId, browserIds, eventIds, identity } = {}) => {
  const existing = readMetaJourneyCache() ?? {};
  const resolvedSessionId = getOrCreateMetaSessionId(sessionId || existing.sessionId);
  const mergedIdentity = mergeMetaIdentity(existing.identity, identity, {
    externalId:
      normalizeString(identity?.externalId) ||
      normalizeString(existing.identity?.externalId) ||
      resolvedSessionId,
  });
  const merged = {
    sessionId: resolvedSessionId,
    browserIds: mergeMetaBrowserIdentifiers(existing.browserIds, browserIds),
    eventIds: { ...(existing.eventIds ?? {}), ...(eventIds ?? {}) },
    identity: mergedIdentity,
  };
  writeMetaJourneyCache(merged);
  return merged;
};

// The un-hashed user_data sent to /api/meta-events (hashed server-side).
export const buildMetaUserData = ({ identity, browserIds, externalId } = {}) => {
  const mergedIdentity = mergeMetaIdentity(identity, { externalId });
  const mergedBrowserIds = mergeMetaBrowserIdentifiers(browserIds);
  return Object.fromEntries(
    Object.entries({
      email: mergedIdentity.email,
      phone: mergedIdentity.phone,
      firstName: mergedIdentity.firstName,
      lastName: mergedIdentity.lastName,
      city: mergedIdentity.city,
      state: mergedIdentity.state,
      zip: mergedIdentity.zip,
      country: mergedIdentity.country,
      externalId: mergedIdentity.externalId,
      fbp: mergedBrowserIds.fbp,
      fbc: mergedBrowserIds.fbc,
    }).filter(([, value]) => Boolean(value))
  );
};

export const buildFbcFromFbclid = (fbclid, timestamp = Date.now()) =>
  `fb.1.${Math.floor(timestamp)}.${fbclid}`;

export const getMetaBrowserIdentifiers = (searchParams) => {
  const fbclidFromUrl = searchParams?.get("fbclid") ?? undefined;
  const fbclid = fbclidFromUrl || getCookieValue("fbclid");
  const fbp = getCookieValue("_fbp");
  const cookieFbc = getCookieValue("_fbc");
  const fbc = cookieFbc || (fbclid ? buildFbcFromFbclid(fbclid) : undefined);
  const merged = mergeMetaBrowserIdentifiers(readMetaJourneyCache()?.browserIds, {
    fbclid,
    fbp,
    fbc,
  });
  upsertMetaJourneyCache({ browserIds: merged });
  return merged;
};
