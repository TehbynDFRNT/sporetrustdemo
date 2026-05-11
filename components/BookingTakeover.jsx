"use client";

import { useEffect, useRef, useState } from "react";
import BookingForm from "./BookingForm";
import Brand from "./Brand";

const OPEN_BOOKING_EVENT = "sporetrust:open-booking";

export default function BookingTakeover() {
  const [open, setOpen] = useState(false);
  const [bookingRequest, setBookingRequest] = useState({ id: 0, location: null });
  const returnFocusRef = useRef(null);

  useEffect(() => {
    function normalizeLocation(location) {
      if (typeof location === "string") {
        return { label: location, postcode: "", placeId: "", lat: "", lng: "" };
      }

      return {
        label: String(location?.label || "").trim(),
        postcode: String(location?.postcode || "").trim(),
        placeId: String(location?.placeId || "").trim(),
        lat: location?.lat || "",
        lng: location?.lng || "",
      };
    }

    function openBooking(location = null) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setBookingRequest((current) => ({
        id: current.id + 1,
        location: normalizeLocation(location),
      }));
      setOpen(true);
    }

    function handleClick(event) {
      const trigger = event.target?.closest?.('a[href="#book"], [data-booking-trigger]');

      if (!trigger) return;

      event.preventDefault();
      openBooking(trigger.dataset?.location || trigger.dataset?.postcode);
    }

    function handleOpenEvent(event) {
      openBooking(event.detail?.location || event.detail?.postcode);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener(OPEN_BOOKING_EVENT, handleOpenEvent);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener(OPEN_BOOKING_EVENT, handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  function closeBooking() {
    setOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus?.());
  }

  if (!open) return null;

  return (
    <div className="booking-takeover book" role="dialog" aria-modal="true" aria-labelledby="booking-takeover-title">
      <div className="booking-takeover-chrome">
        <Brand />
        <p id="booking-takeover-title">Diagnostic booking</p>
        <button type="button" className="booking-takeover-close" onClick={closeBooking}>
          Close
        </button>
      </div>

      <div className="booking-takeover-body">
        <BookingForm initialLocation={bookingRequest.location} lookupNonce={bookingRequest.id} />
      </div>
    </div>
  );
}
