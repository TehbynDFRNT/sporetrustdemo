"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowIcon from "./icons/ArrowIcon";
import PostcodeAutocomplete from "./PostcodeAutocomplete";

const formatter = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Australia/Brisbane",
});

const timeFormatter = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Australia/Brisbane",
});

const roles = [
  "Homeowner",
  "Tenant / renter",
  "Landlord",
  "Property manager",
  "Buyer (pre-purchase)",
  "Other",
];

const POSTCODE_LOOKUP_EVENT = "sporetrust:postcode-lookup";

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

function formatDate(date) {
  return formatter.format(new Date(`${date}T00:00:00+10:00`));
}

function formatTime(start) {
  return timeFormatter.format(new Date(start));
}

export default function BookingForm({ initialLocation = null, lookupNonce = 0 }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [slotDays, setSlotDays] = useState([]);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const processedLookupRef = useRef(0);
  const [form, setForm] = useState({
    locationLabel: "",
    postcode: "",
    placeId: "",
    lat: "",
    lng: "",
    day: "",
    start: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    message: "",
  });

  const selectedDay = useMemo(
    () => slotDays.find((day) => day.date === form.day),
    [form.day, slotDays]
  );

  useEffect(() => {
    const savedLocation = window.sessionStorage.getItem("sporetrust_location");

    if (savedLocation) {
      try {
        const location = normalizeLocation(JSON.parse(savedLocation));

        setForm((current) => ({
          ...current,
          locationLabel: location.label,
          postcode: location.postcode,
          placeId: location.placeId,
          lat: location.lat,
          lng: location.lng,
        }));
      } catch {
        window.sessionStorage.removeItem("sporetrust_location");
      }
    }
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  const updateSuburbLocation = useCallback((selectedLocation) => {
    const location = normalizeLocation(selectedLocation);

    setForm((current) => ({
      ...current,
      locationLabel: location.label,
      postcode: location.postcode,
      placeId: location.placeId,
      lat: location.lat,
      lng: location.lng,
    }));
    setError("");
  }, []);

  const loadSlots = useCallback(async (locationOverride) => {
    const location = normalizeLocation(locationOverride || {
      label: form.locationLabel,
      postcode: form.postcode,
      placeId: form.placeId,
      lat: form.lat,
      lng: form.lng,
    });

    if (!location.label) {
      setError("Choose your suburb first.");
      return;
    }

    setError("");
    setStatus("loading");
    setStep(0);
    setSlotDays([]);
    window.sessionStorage.setItem("sporetrust_location", JSON.stringify(location));
    setForm((current) => ({
      ...current,
      locationLabel: location.label,
      postcode: location.postcode,
      placeId: location.placeId,
      lat: location.lat,
      lng: location.lng,
      day: "",
      start: "",
    }));

    try {
      const response = await fetch("/api/cal/slots?days=21", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not load available times.");
      }

      setSlotDays(payload.days || []);
      setStep(1);
    } catch (loadError) {
      setError(loadError.message || "Could not load available times.");
    } finally {
      setStatus("idle");
    }
  }, [form.lat, form.lng, form.locationLabel, form.placeId, form.postcode]);

  useEffect(() => {
    const location = normalizeLocation(initialLocation);

    if (!lookupNonce || processedLookupRef.current === lookupNonce || !location.label) return;

    processedLookupRef.current = lookupNonce;
    setForm((current) => ({
      ...current,
      locationLabel: location.label,
      postcode: location.postcode,
      placeId: location.placeId,
      lat: location.lat,
      lng: location.lng,
    }));
    loadSlots(location);
  }, [initialLocation, loadSlots, lookupNonce]);

  useEffect(() => {
    function handlePostcodeLookup(event) {
      const location = normalizeLocation(event.detail?.location || event.detail?.postcode);

      if (location.label) {
        loadSlots(location);
      }
    }

    window.addEventListener(POSTCODE_LOOKUP_EVENT, handlePostcodeLookup);

    return () => window.removeEventListener(POSTCODE_LOOKUP_EVENT, handlePostcodeLookup);
  }, [loadSlots]);

  async function submitBooking(event) {
    event.preventDefault();
    setError("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/cal/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not create the booking.");
      }

      setSubmittedBooking(payload.booking || {});
      setStep(4);
    } catch (bookingError) {
      setError(bookingError.message || "Could not create the booking.");
    } finally {
      setStatus("idle");
    }
  }

  if (step === 4) {
    return (
      <div className="book-form booking-confirmation">
        <span className="wizard-kicker">Booking received</span>
        <h3>We have your inspection request.</h3>
        <p>
          You will receive the Cal.com confirmation shortly. We will use the property address
          and notes you supplied to prepare the site visit.
        </p>
        {submittedBooking?.uid ? <small>Booking reference: {submittedBooking.uid}</small> : null}
      </div>
    );
  }

  return (
    <form className="book-form booking-wizard" onSubmit={submitBooking}>
      <div className="wizard-progress" aria-label="Booking progress">
        {["Suburb", "Day", "Time", "Details"].map((label, index) => (
          <span key={label} className={index === step ? "active" : index < step ? "done" : ""}>
            {label}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <div className="wizard-panel wizard-start">
          {status === "loading" ? (
            <div className="wizard-location-loading" role="status" aria-live="polite">
              <span className="wizard-kicker">Checking location</span>
              <h3>Checking your location.</h3>
              <p>Looking for live inspection times near {form.locationLabel || "your selected suburb"}.</p>
              <div className="location-loader" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <>
              <div className="wizard-panel-head">
                <span className="wizard-kicker">Step 1</span>
                <h3>Start with your suburb.</h3>
              </div>
              <div className="postcode-check">
                <PostcodeAutocomplete
                  id="f-suburb"
                  name="postcode"
                  label="Suburb"
                  placeholder="Your suburb"
                  value={form.locationLabel}
                  onLocation={updateSuburbLocation}
                />
                <button type="button" className="btn wizard-next" onClick={() => loadSlots()}>
                  Check live times <ArrowIcon />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="wizard-panel">
          <div className="wizard-panel-head">
            <span className="wizard-kicker">Step 2</span>
            <h3>Choose a day.</h3>
          </div>

          {slotDays.length ? (
            <div className="slot-grid">
              {slotDays.map((day) => (
                <button
                  type="button"
                  key={day.date}
                  className={form.day === day.date ? "slot-choice active" : "slot-choice"}
                  onClick={() => {
                    setForm((current) => ({ ...current, day: day.date, start: "" }));
                    setStep(2);
                  }}
                >
                  {formatDate(day.date)}
                  <small>{day.slots.length} times</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="wizard-empty">
              <h3>No live times are showing yet.</h3>
              <p>
                The booking calendar is connected, but Cal is not returning available slots right now.
                Reconnect the calendar in Cal.com, then check again.
              </p>
              <button type="button" className="btn" onClick={() => loadSlots()} disabled={status === "loading"}>
                {status === "loading" ? "Checking..." : "Check again"} <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-panel">
          <div className="wizard-panel-head">
            <button type="button" className="wizard-back" onClick={() => setStep(1)}>
              Back
            </button>
            <span className="wizard-kicker">{form.day ? formatDate(form.day) : "Step 3"}</span>
            <h3>Choose a time.</h3>
          </div>

          <div className="slot-grid time-grid">
            {(selectedDay?.slots || []).map((slot) => (
              <button
                type="button"
                key={slot.start}
                className={form.start === slot.start ? "slot-choice active" : "slot-choice"}
                onClick={() => {
                  setForm((current) => ({ ...current, start: slot.start }));
                  setStep(3);
                }}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-panel">
          <div className="wizard-panel-head">
            <button type="button" className="wizard-back" onClick={() => setStep(2)}>
              Back
            </button>
            <span className="wizard-kicker">{formatTime(form.start)}</span>
            <h3>Where should we inspect?</h3>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-name">Your name</label>
              <input id="f-name" name="name" type="text" required placeholder="Jane Doe" value={form.name} onChange={updateField} />
            </div>
            <div className="field">
              <label htmlFor="f-phone">Phone</label>
              <input id="f-phone" name="phone" type="tel" required placeholder="04xx xxx xxx" value={form.phone} onChange={updateField} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-email">Email</label>
              <input id="f-email" name="email" type="email" required placeholder="jane@email.com" value={form.email} onChange={updateField} />
            </div>
            <div className="field">
              <label htmlFor="f-role">I'm a...</label>
              <select id="f-role" name="role" required value={form.role} onChange={updateField}>
                <option value="">Select one</option>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-address">Property address</label>
            <input id="f-address" name="address" type="text" required placeholder="Street address, suburb" value={form.address} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="f-msg">What are you seeing? (optional)</label>
            <textarea
              id="f-msg"
              name="message"
              placeholder="e.g. recurring mould on bedroom wall after recent storm, smell in the wardrobe, tenant complaint"
              value={form.message}
              onChange={updateField}
            />
          </div>

          <div className="submit-row">
            <button type="submit" className="btn" disabled={status === "submitting" || !form.start}>
              {status === "submitting" ? "Booking..." : "Book inspection"} <ArrowIcon />
            </button>
            <small>Creates a Cal.com booking.</small>
          </div>
        </div>
      ) : null}

      {error ? <p className="wizard-error">{error}</p> : null}
    </form>
  );
}
