"use client";

import { useEffect, useRef, useState } from "react";
import { captureAttribution, submitLead } from "../lib/leadSubmit";
import AddressAutocomplete from "./AddressAutocomplete";
import PhoneInput, { normalizeAuPhone } from "./PhoneInput";
import ArrowIcon from "./icons/ArrowIcon";
import ReviewStars from "./ReviewStars";

/* Lead / service hero — offer + persuasion + the conversion itself. The visual
   column carries the lead-capture card (form above the fold) rather than a
   photo: this page's only job is the form, so the form gets the hero slot.
   Deliberately NOT the ecom product-card treatment (no price block) to avoid
   price-scare on cold lead-gen traffic. Content is the tenant template
   (evidence angle) — hardcoded, no props; the homeowner page gets its own. */

const POINTS = [
  {
    title: "Proof it's the building, not you.",
    copy: "Moisture readings settle 'building defect vs tenant-caused' — so the blame conversation ends.",
  },
  {
    title: "Independent of your landlord & agent.",
    copy: "Not their contractor — a neutral third party both sides have to take seriously.",
  },
  {
    title: "A report that forces action.",
    copy: "Cause, extent and liveability notes, formatted for your agent, landlord or QCAT.",
  },
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

export default function ServiceHero() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  // Structured Places selection (suburb/postcode/lat/lng/placeId) — null until
  // a suggestion is picked, cleared again if the address is edited afterwards.
  const addressRef = useRef(null);

  useEffect(() => {
    captureAttribution();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") || "").trim();
    setName(firstName);
    submitLead(
      {
        audience: String(data.get("audience") || "tenant"),
        firstName,
        phone: normalizeAuPhone(data.get("phone")) || String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
        address: String(data.get("address") || "").trim(),
        ...(addressRef.current || {}),
      },
      { form: "hero" },
    );
    setSubmitted(true);
  }

  return (
    <section className="service-hero" aria-labelledby="service-hero-title">
      <div className="wrap service-hero__wrap">
        <div className="service-hero__content">
          {/* OFFER */}
          <span className="service-hero__eyebrow">[ for renters · mould &amp; damp evidence ]</span>
          <h1 className="service-hero__title" id="service-hero-title">
            Mould in your rental? Get the evidence your landlord can&rsquo;t argue with.
          </h1>
          <p className="service-hero__lede">
            An independent inspection that documents the cause, the damage, and whether it&rsquo;s a
            building defect — in plain English, within 48 hours. The record you need to get repairs
            actioned, meet minimum housing standards, or take to QCAT.
          </p>

          {/* PERSUASION */}
          <div className="service-hero__proof">
            <ReviewStars className="service-hero__stars" />
            <span className="service-hero__proof-text">
              Independent &amp; certified — credentials your landlord can&rsquo;t dismiss
            </span>
          </div>
          <ul className="service-hero__points" role="list">
            {POINTS.map((item) => (
              <li className="service-hero__point" key={item.title}>
                <CheckGlyph />
                <span>
                  <strong>{item.title}</strong> {item.copy}
                </span>
              </li>
            ))}
          </ul>

          <div className="service-hero__actions">
            <a className="service-hero__cta-ghost" href="#how-it-works">
              See how it works
            </a>
          </div>
          <p className="service-hero__reassurance">
            No callout fees · IICRC certified · NATA-accredited labs · Brisbane &amp; SEQ
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
                <span className="service-hero__form-kicker">Independent — no ties to landlords or agents</span>
                <h2 className="service-hero__form-title">Request your inspection</h2>
                <p className="service-hero__form-sub">
                  Same-business-day reply. No obligation, no callout fee.
                </p>
              </div>
              <form className="lead-form__form" onSubmit={handleSubmit} noValidate>
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
                  <div className="lead-form__field">
                    <label className="lead-form__label" htmlFor="shf-firstName">First name</label>
                    <input className="lead-form__input" id="shf-firstName" name="firstName" type="text" autoComplete="given-name" required />
                  </div>
                  <div className="lead-form__field">
                    <label className="lead-form__label" htmlFor="shf-phone">Phone</label>
                    <PhoneInput id="shf-phone" name="phone" required />
                  </div>
                </div>
                <div className="lead-form__field">
                  <label className="lead-form__label" htmlFor="shf-address">Property address</label>
                  <AddressAutocomplete
                    id="shf-address"
                    name="address"
                    placeholder="Start typing the rental's address…"
                    required
                    onAddress={(location) => {
                      addressRef.current = location;
                    }}
                  />
                </div>
                <div className="lead-form__field">
                  <label className="lead-form__label" htmlFor="shf-email">Email</label>
                  <input className="lead-form__input" id="shf-email" name="email" type="email" autoComplete="email" required />
                </div>
                <button type="submit" className="lead-form__submit">
                  Request my inspection
                  <ArrowIcon />
                </button>
                <p className="lead-form__note">
                  Fixed price confirmed on the call — often recoverable from the lessor when the
                  mould is building-caused.
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
