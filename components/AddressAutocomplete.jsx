"use client";

import { useEffect, useRef } from "react";
import { extractPostcode, extractSuburb, loadGooglePlaces } from "./googlePlaces";

/* Full street-address variant of the Places integration — same singleton
   loader as PostcodeAutocomplete (which stays the suburb/regions variant).
   Renders a bare input so it inherits the host form's styling, and the
   visible input carries `name` so FormData still captures whatever was
   typed when Maps is unavailable (no key, blocked, offline). Structured
   parts (suburb, postcode, lat/lng, placeId) arrive via onAddress after a
   suggestion is picked; typing again clears them (onAddress(null)) so a
   stale selection never rides along with an edited address. Loads the SDK
   on first focus only — this sits on paid landers, keep first paint clean. */

function latLngValue(value) {
  if (typeof value === "function") return value();
  return value ?? "";
}

export default function AddressAutocomplete({
  id,
  name = "address",
  className = "lead-form__input",
  placeholder = "Street address",
  required = false,
  onAddress,
  ...rest
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const loadingRef = useRef(null);

  function bindPlaceChanged() {
    if (!autocompleteRef.current) return;

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      const label = String(place?.formatted_address || inputRef.current?.value || "").trim();
      const location = place?.geometry?.location;

      onAddress?.({
        address: label,
        suburb: extractSuburb(place),
        postcode: extractPostcode(place),
        placeId: place?.place_id || "",
        lat: latLngValue(location?.lat),
        lng: latLngValue(location?.lng),
      });
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
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
          types: ["address"],
        });
        bindPlaceChanged();

        return autocompleteRef.current;
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Google Places address autocomplete unavailable.", error);
        }
        return null;
      })
      .finally(() => {
        loadingRef.current = null;
      });

    return loadingRef.current;
  }

  useEffect(() => {
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event?.clearInstanceListeners) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, []);

  function handleChange() {
    ensureAutocomplete();
    onAddress?.(null);
  }

  return (
    <input
      {...rest}
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      className={className}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
      onFocus={ensureAutocomplete}
      onMouseDown={ensureAutocomplete}
      onChange={handleChange}
    />
  );
}
