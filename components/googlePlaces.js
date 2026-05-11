let googlePlacesPromise;

export function loadGooglePlaces(apiKey) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (!apiKey) return Promise.reject(new Error("Google Maps key is not configured."));

  if (!googlePlacesPromise) {
    googlePlacesPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("google-maps-places");

      if (existing) {
        existing.addEventListener("load", () => resolve(window.google), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-places";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googlePlacesPromise;
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
