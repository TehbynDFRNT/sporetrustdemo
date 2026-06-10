"use client";

import { useEffect, useRef, useState } from "react";
import { captureAttribution, submitLead, validateLead } from "../lib/leadSubmit";
import AddressAutocomplete from "./AddressAutocomplete";
import PhoneInput from "./PhoneInput";
import ArrowIcon from "./icons/ArrowIcon";

/* Full lead-capture section — the catch-all conversion at the bottom of the
   paid-media form arm (the hero carries a compact twin for above-the-fold).
   Low commitment: no payment, no calendar — a contactable lead for same-day
   phone follow-up. Submission plumbing lives in lib/leadSubmit.js. */

const STEPS = [
  ["We call you today", "We confirm the details and fixed price, around your schedule."],
  ["We inspect — 45 minutes", "Thermal, moisture and air sampling, fully documented on-site."],
  ["Report in 48 hours", "Landlord, agent and QCAT-ready evidence in plain English."],
];

// Visual order of the enquire form's fields — first invalid one gets focus.
const FIELD_IDS = { firstName: "lf-firstName", phone: "lf-phone", email: "lf-email", address: "lf-address" };
const FIELD_ORDER = ["firstName", "phone", "email", "address"];

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  // Structured Places selection (suburb/postcode/lat/lng/placeId) — null until
  // a suggestion is picked, cleared again if the address is edited afterwards.
  const addressRef = useRef(null);

  useEffect(() => {
    captureAttribution();
  }, []);

  // Errors appear on submit, clear as soon as the offending field is edited.
  function handleFormInput(event) {
    const key = event.target?.name;
    if (!key || !errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { errors: nextErrors, values, isValid } = validateLead({
      firstName: data.get("firstName"),
      phone: data.get("phone"),
      email: data.get("email"),
      address: data.get("address"),
    });

    if (!isValid) {
      setErrors(nextErrors);
      const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);
      if (firstInvalid) document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    setErrors({});
    setName(values.firstName);
    submitLead(
      {
        audience: String(data.get("audience") || "tenant"),
        ...values,
        detail: String(data.get("detail") || "").trim(),
        ...(addressRef.current || {}),
      },
      { form: "enquire" },
    );
    setSubmitted(true);
  }

  function fieldClass(key) {
    return `lead-form__field${errors[key] ? " has-error" : ""}`;
  }

  return (
    <section className="lead-form" id="enquire" aria-labelledby="lead-form-title">
      <div className="wrap lead-form__wrap">
        <div className="lead-form__intro">
          <span className="eyebrow">[ request your inspection ]</span>
          <h2 id="lead-form-title">Get the evidence started.</h2>
          <p className="lead-form__lede">
            Tell us what&rsquo;s happening. We&rsquo;ll confirm fit and come back the same business
            day — no obligation, no callout fee, independent of any landlord or agent.
          </p>
          <ol className="lead-form__steps">
            {STEPS.map(([title, copy], i) => (
              <li className="lead-form__step" key={title}>
                <span className="lead-form__step-num">{i + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <span>{copy}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lead-form__card">
          {submitted ? (
            <div className="lead-form__success" role="status">
              <span className="lead-form__success-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12.5 9.5 18 20 6.5" />
                </svg>
              </span>
              <h3>Thanks{name ? `, ${name}` : ""} — we&rsquo;ve got it.</h3>
              <p>
                We&rsquo;ll call you today to confirm the details and lock in a time that works.
                Keep an eye on your phone.
              </p>
            </div>
          ) : (
            <form className="lead-form__form" onSubmit={handleSubmit} onInput={handleFormInput} noValidate>
              <div className="lead-form__field">
                <span className="lead-form__label" id="lf-audience-label">I am a:</span>
                <div className="lead-form__split" role="radiogroup" aria-labelledby="lf-audience-label">
                  <label className="lead-form__split-opt">
                    <input type="radio" name="audience" value="tenant" defaultChecked />
                    <span>Tenant</span>
                  </label>
                  <label className="lead-form__split-opt">
                    <input type="radio" name="audience" value="homeowner" />
                    <span>Homeowner</span>
                  </label>
                </div>
              </div>
              <div className={fieldClass("firstName")}>
                <label className="lead-form__label" htmlFor="lf-firstName">First name</label>
                <input
                  className="lead-form__input"
                  id="lf-firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-invalid={errors.firstName ? true : undefined}
                  aria-describedby={errors.firstName ? "lf-firstName-error" : undefined}
                />
                {errors.firstName ? (
                  <p className="lead-form__error" id="lf-firstName-error">{errors.firstName}</p>
                ) : null}
              </div>
              <div className="lead-form__row">
                <div className={fieldClass("phone")}>
                  <label className="lead-form__label" htmlFor="lf-phone">Phone</label>
                  <PhoneInput
                    id="lf-phone"
                    name="phone"
                    required
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? "lf-phone-error" : undefined}
                  />
                  {errors.phone ? (
                    <p className="lead-form__error" id="lf-phone-error">{errors.phone}</p>
                  ) : null}
                </div>
                <div className={fieldClass("email")}>
                  <label className="lead-form__label" htmlFor="lf-email">Email</label>
                  <input
                    className="lead-form__input"
                    id="lf-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "lf-email-error" : undefined}
                  />
                  {errors.email ? (
                    <p className="lead-form__error" id="lf-email-error">{errors.email}</p>
                  ) : null}
                </div>
              </div>
              <div className={fieldClass("address")}>
                <label className="lead-form__label" htmlFor="lf-address">Property address</label>
                <AddressAutocomplete
                  id="lf-address"
                  name="address"
                  placeholder="Start typing the rental's address…"
                  required
                  aria-invalid={errors.address ? true : undefined}
                  aria-describedby={errors.address ? "lf-address-error" : undefined}
                  onAddress={(location) => {
                    addressRef.current = location;
                  }}
                />
                {errors.address ? (
                  <p className="lead-form__error" id="lf-address-error">{errors.address}</p>
                ) : null}
              </div>
              <div className="lead-form__field">
                <label className="lead-form__label" htmlFor="lf-detail">
                  What are you seeing? <span className="lead-form__optional">(optional)</span>
                </label>
                <textarea
                  className="lead-form__textarea"
                  id="lf-detail"
                  name="detail"
                  rows={3}
                  placeholder="Visible mould, a smell, a leak, a landlord who's stopped responding…"
                />
              </div>
              <button type="submit" className="lead-form__submit">
                Request my inspection
                <ArrowIcon />
              </button>
              <p className="lead-form__note">
                Fixed price confirmed on the call — often recoverable from the lessor when the
                mould is building-caused.
              </p>
              <p className="lead-form__note">
                We&rsquo;ll never share your details. Same-business-day reply.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
