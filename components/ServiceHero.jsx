"use client";

import { useEffect, useRef, useState } from "react";
import { captureAttribution, submitLead, validateLead } from "../lib/leadSubmit";
import AddressAutocomplete from "./AddressAutocomplete";
import PhoneInput from "./PhoneInput";
import ArrowIcon from "./icons/ArrowIcon";

/* Lead / service hero — offer + persuasion + the conversion itself. The visual
   column carries the lead-capture card (form above the fold) rather than a
   photo: this page's only job is the form, so the form gets the hero slot.
   Deliberately NOT the ecom product-card treatment (no price block) to avoid
   price-scare on cold lead-gen traffic. Content is the tenant template
   (evidence angle) — hardcoded, no props; the homeowner page gets its own. */

const POINTS = [
  "Proof it's the building, not you",
  "Independent of your landlord and agent",
  "A report your agent or QCAT will act on",
];

function CheckGlyph() {
  return (
    <svg className="service-hero__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Visual order of the hero form's fields — first invalid one gets focus.
const FIELD_IDS = { firstName: "shf-firstName", phone: "shf-phone", address: "shf-address", email: "shf-email" };
const FIELD_ORDER = ["firstName", "phone", "address", "email"];

export default function ServiceHero() {
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
        ...(addressRef.current || {}),
      },
      { form: "hero" },
    );
    setSubmitted(true);
  }

  function fieldClass(key) {
    return `lead-form__field${errors[key] ? " has-error" : ""}`;
  }

  return (
    <section className="service-hero" aria-labelledby="service-hero-title">
      <div className="wrap service-hero__wrap">
        <div className="service-hero__content">
          {/* OFFER */}
          <span className="service-hero__eyebrow">[ for renters · mould &amp; damp evidence ]</span>
          <h1 className="service-hero__title" id="service-hero-title">
            Mould in your rental? Prove it&rsquo;s the building&rsquo;s fault — and get it fixed.
          </h1>
          <p className="service-hero__lede">
            An independent inspection that proves what caused your mould — in a plain-English
            report your landlord, agent or QCAT will act on. In your hands within 48 hours.
          </p>

          {/* PERSUASION */}
          <ul className="service-hero__points" role="list">
            {POINTS.map((item) => (
              <li className="service-hero__point" key={item}>
                <CheckGlyph />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="service-hero__reassurance">
            IICRC-certified · No callout fees · Brisbane &amp; South-East Queensland
          </p>
        </div>

        {/* CONVERSION — the form card holds the hero's visual slot */}
        <div className="lead-form__card service-hero__form">
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
            <>
              <div className="service-hero__form-head">
                <h2 className="service-hero__form-title">Request your inspection</h2>
                <p className="service-hero__form-sub">
                  Same-business-day reply. No obligation, no callout fee.
                </p>
              </div>
              <form className="lead-form__form" onSubmit={handleSubmit} onInput={handleFormInput} noValidate>
                <div className="lead-form__field">
                  <span className="lead-form__label" id="shf-audience-label">I am a:</span>
                  <div className="lead-form__split" role="radiogroup" aria-labelledby="shf-audience-label">
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
                <div className="lead-form__row">
                  <div className={fieldClass("firstName")}>
                    <label className="lead-form__label" htmlFor="shf-firstName">First name</label>
                    <input
                      className="lead-form__input"
                      id="shf-firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      aria-invalid={errors.firstName ? true : undefined}
                      aria-describedby={errors.firstName ? "shf-firstName-error" : undefined}
                    />
                    {errors.firstName ? (
                      <p className="lead-form__error" id="shf-firstName-error">{errors.firstName}</p>
                    ) : null}
                  </div>
                  <div className={fieldClass("phone")}>
                    <label className="lead-form__label" htmlFor="shf-phone">Phone</label>
                    <PhoneInput
                      id="shf-phone"
                      name="phone"
                      required
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? "shf-phone-error" : undefined}
                    />
                    {errors.phone ? (
                      <p className="lead-form__error" id="shf-phone-error">{errors.phone}</p>
                    ) : null}
                  </div>
                </div>
                <div className={fieldClass("address")}>
                  <label className="lead-form__label" htmlFor="shf-address">Property address</label>
                  <AddressAutocomplete
                    id="shf-address"
                    name="address"
                    placeholder="Start typing the rental's address…"
                    required
                    aria-invalid={errors.address ? true : undefined}
                    aria-describedby={errors.address ? "shf-address-error" : undefined}
                    onAddress={(location) => {
                      addressRef.current = location;
                    }}
                  />
                  {errors.address ? (
                    <p className="lead-form__error" id="shf-address-error">{errors.address}</p>
                  ) : null}
                </div>
                <div className={fieldClass("email")}>
                  <label className="lead-form__label" htmlFor="shf-email">Email</label>
                  <input
                    className="lead-form__input"
                    id="shf-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "shf-email-error" : undefined}
                  />
                  {errors.email ? (
                    <p className="lead-form__error" id="shf-email-error">{errors.email}</p>
                  ) : null}
                </div>
                <button type="submit" className="lead-form__submit">
                  Request my inspection
                  <ArrowIcon />
                </button>
                <p className="lead-form__note">
                  Fixed price confirmed on the call. If the building&rsquo;s at fault, the cost can
                  be claimed back from your landlord.
                </p>
                <p className="lead-form__note">We&rsquo;ll never share your details.</p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
