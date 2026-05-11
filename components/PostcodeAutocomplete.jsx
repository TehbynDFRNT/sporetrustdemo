"use client";

import { useEffect, useRef, useState } from "react";
import { extractPostcode, loadGooglePlaces } from "./googlePlaces";

function postcodeFromText(value) {
  return String(value || "").match(/\b\d{4}\b/)?.[0] || "";
}

function latLngFromGeometry(geometry) {
  const location = geometry?.location;

  if (!location) return { lat: "", lng: "" };

  return {
    lat: typeof location.lat === "function" ? location.lat() : location.lat || "",
    lng: typeof location.lng === "function" ? location.lng() : location.lng || "",
  };
}

function payloadFromPlace(place, visibleValue) {
  const label = String(visibleValue || "").trim();
  const coords = latLngFromGeometry(place?.geometry);

  return {
    label,
    placeId: place?.place_id || "",
    postcode: extractPostcode(place) || postcodeFromText(label),
    lat: coords.lat,
    lng: coords.lng,
  };
}

export default function PostcodeAutocomplete({
  id,
  label,
  name = "postcode",
  value,
  onLocation,
  onPostcode,
  placeholder = "Suburb",
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const loadingRef = useRef(null);
  const [hiddenPostcode, setHiddenPostcode] = useState(postcodeFromText(value));

  useEffect(() => {
    const next = value || "";

    setHiddenPostcode(postcodeFromText(next));

    if (!inputRef.current || document.activeElement === inputRef.current) return;

    inputRef.current.value = next;
  }, [value]);

  function emitLocation(location) {
    onLocation?.(location);
    onPostcode?.(location.postcode || "");
  }

  function bindPlaceChanged() {
    if (!autocompleteRef.current) return;

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      const visibleValue = inputRef.current?.value || "";
      const location = payloadFromPlace(place, visibleValue);

      setHiddenPostcode(location.postcode);
      emitLocation(location);
    });
  }

  async function ensureAutocomplete() {
    if (autocompleteRef.current) return autocompleteRef.current;
    if (loadingRef.current) return loadingRef.current;

    loadingRef.current = loadGooglePlaces(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places?.Autocomplete || autocompleteRef.current) return null;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "au" },
          fields: ["address_components", "geometry", "name", "place_id"],
          types: ["(regions)"],
        });
        bindPlaceChanged();

        return autocompleteRef.current;
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Google Places autocomplete unavailable.", error);
        }
        return null;
      })
      .finally(() => {
        loadingRef.current = null;
      });

    return loadingRef.current;
  }

  useEffect(() => {
    loadGooglePlaces(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Google Places script unavailable.", error);
      }
    });

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event?.clearInstanceListeners) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, []);

  function handleManualChange(event) {
    const next = event.target.value;
    const typedPostcode = postcodeFromText(next);

    ensureAutocomplete();
    setHiddenPostcode(typedPostcode);
    emitLocation({ label: next, placeId: "", postcode: typedPostcode, lat: "", lng: "" });
  }

  return (
    <div className="field postcode-autocomplete-field">
      <label htmlFor={id}>{label}</label>
      <div className="postcode-autocomplete">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          placeholder={placeholder}
          defaultValue={value || ""}
          onFocus={ensureAutocomplete}
          onMouseDown={ensureAutocomplete}
          onChange={handleManualChange}
          autoComplete="off"
        />
        <input type="hidden" name={name} value={hiddenPostcode} />
      </div>
    </div>
  );
}
