"use client";

import { useCallback, useState } from "react";
import PostcodeAutocomplete from "./PostcodeAutocomplete";

const OPEN_BOOKING_EVENT = "sporetrust:open-booking";

export default function HeroAvailabilityForm() {
  const [location, setLocation] = useState({ label: "", postcode: "", placeId: "", lat: "", lng: "" });
  const handleSuburbLocation = useCallback((selectedLocation) => setLocation(selectedLocation), []);

  function handleSubmit(event) {
    event.preventDefault();

    const selectedLocation = {
      ...location,
      label: String(location.label || "").trim(),
    };

    if (selectedLocation.label) {
      window.sessionStorage.setItem("sporetrust_location", JSON.stringify(selectedLocation));
    }

    window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { location: selectedLocation } }));
  }

  return (
    <form className="hero-form" onSubmit={handleSubmit}>
      <div className="hero-form-row">
        <PostcodeAutocomplete
          id="hero-suburb"
          name="postcode"
          label="Suburb"
          placeholder="Your suburb"
          value={location.label}
          onLocation={handleSuburbLocation}
        />
        <button type="submit">Check availability</button>
      </div>
    </form>
  );
}
