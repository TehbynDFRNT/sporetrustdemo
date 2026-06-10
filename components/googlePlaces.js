let googlePlacesPromise;

/* With `loading=async`, the places library is NOT guaranteed to exist at
   script onload — it must be awaited via importLibrary. Resolving before
   that races the widget constructors (Autocomplete undefined on first
   focus, silently never attached). */
function whenPlacesReady() {
  const google = window.google;
  if (google?.maps?.places?.Autocomplete) return Promise.resolve(google);
  if (google?.maps?.importLibrary) {
    return google.maps.importLibrary("places").then(() => google);
  }
  return Promise.resolve(google);
}

export function loadGooglePlaces(apiKey) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places?.Autocomplete) return Promise.resolve(window.google);
  if (!apiKey) return Promise.reject(new Error("Google Maps key is not configured."));

  if (!googlePlacesPromise) {
    googlePlacesPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("google-maps-places");

      if (existing) {
        if (window.google?.maps) {
          whenPlacesReady().then(resolve, reject);
          return;
        }
        existing.addEventListener("load", () => whenPlacesReady().then(resolve, reject), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-places";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => whenPlacesReady().then(resolve, reject);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googlePlacesPromise;
}

export function extractSuburb(place) {
  const components = place?.addressComponents || place?.address_components || [];
  const suburbComponent = components.find(
    (component) =>
      component.types?.includes("locality") || component.types?.includes("sublocality"),
  );

  return (
    suburbComponent?.shortText ||
    suburbComponent?.longText ||
    suburbComponent?.short_name ||
    suburbComponent?.long_name ||
    ""
  );
}

export function extractPostcode(place) {
  const components = place?.addressComponents || place?.address_components || [];
  const postalComponent = components.find((component) => component.types?.includes("postal_code"));
  const directPostcode =
    postalComponent?.shortText ||
    postalComponent?.longText ||
    postalComponent?.short_name ||
    postalComponent?.long_name;

  if (directPostcode) return directPostcode;

  const displayName = typeof place?.displayName === "string" ? place.displayName : place?.displayName?.text;
  const fallback = `${place?.name || ""} ${displayName || ""} ${place?.formattedAddress || ""} ${place?.formatted_address || ""}`.match(/\b\d{4}\b/);

  return fallback?.[0] || "";
}
