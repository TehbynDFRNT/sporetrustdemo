"use client";

import { useEffect, useRef, useState } from "react";
import ArrowIcon from "./icons/ArrowIcon";
import Eyebrow from "./Eyebrow";
import PhoneInput from "./PhoneInput";
import PostcodeAutocomplete from "./PostcodeAutocomplete";
import { fetchWeatherSummary } from "../lib/weather";
import { findNearestMouldRegion } from "../lib/mouldIndex";
import { scoreQuiz } from "../lib/quizScoring";
import { submitLead, validateLead } from "../lib/leadSubmit";
import {
  QUESTIONS,
  ResultsStep,
  BreakdownCard,
  ResultsBanner,
} from "./QuizFlow";

/* The gated paid-lander quiz (/mould-risk-check), structured like the MFP
   pricing quiz (proposal.mfpeasy.com.au/pricing-quiz):
   - one question per screen, centered, fade/slide transition between steps
   - a FIXED bottom footer with Back / Continue and a thin progress bar along
     its top edge — explicit advance, not auto-advance on option click
   - no opening location step: the quiz starts on question 1, and the suburb
     is collected at the END inside the contact gate (last field)
   - the gate submits via the footer button; results render footer-less

   Shares QUESTIONS + the results components with the organic QuizFlow, so
   quiz content and scoring stay single-sourced. Weather/regional inputs
   hydrate when the suburb is picked at the gate — scoreQuiz tolerates them
   being absent, so a fast submit just scores without the local signals. */

const GATE_INDEX = QUESTIONS.length; // screens: 0..5 questions, 6 = gate
const TOTAL_STEPS = QUESTIONS.length + 1; // + gate
const EMPTY_LOCATION = { label: "", postcode: "", placeId: "", lat: "", lng: "" };
const EMPTY_ANSWERS = Object.fromEntries(QUESTIONS.map((q) => [q.key, null]));

// Every option renders as an IMAGE CARD (the reference quiz's core mechanic);
// "not sure" options get the neutral grey card instead, per the same pattern.
// Keyed `${question.key}.${option.value}`. Mix of existing site imagery and
// generated cards under /images/quiz/.
const OPTION_MEDIA = {
  "leak.none": { image: "/images/quiz/q-leak-none.jpg" },
  "leak.minor": { image: "/images/quiz/q-leak-minor.jpg" },
  "leak.major": { image: "/images/quiz/q-leak-major.jpg" },
  "leak.unsure": { neutral: true },
  "damp.none": { image: "/images/quiz/q-damp-none.jpg" },
  "damp.suspect": { image: "/images/sign-condensation.png" },
  "damp.confirmed": { image: "/images/sign-splitting-paint.png" },
  "damp.unsure": { neutral: true },
  "spotting.none": { image: "/images/quiz/q-spotting-none.jpg" },
  "spotting.one": { image: "/images/quiz/q-spotting-one.jpg" },
  "spotting.multiple": { image: "/images/quiz/q-spotting-multiple.jpg" },
  "spotting.unsure": { neutral: true },
  "smells.none": { image: "/images/quiz/q-smells-none.jpg" },
  "smells.occasional": { image: "/images/quiz/q-smells-occasional.jpg" },
  "smells.persistent": { image: "/images/quiz/q-smells-persistent.jpg" },
  "smells.unsure": { neutral: true },
  "health.none": { image: "/images/quiz/q-health-none.jpg" },
  "health.sometimes": { image: "/images/quiz/q-health-sometimes.jpg" },
  "health.home": { image: "/images/quiz/q-health-home.jpg" },
  "health.ongoing": { image: "/images/quiz/q-health-ongoing.jpg" },
  "history.none": { image: "/images/quiz/q-history-none.jpg" },
  "history.diy": { image: "/images/quiz/q-history-diy.jpg" },
  "history.professional": { image: "/images/partner-remediation.jpg" },
  "history.recurring": { image: "/images/sign-returning-mould.png" },
};

export default function GatedQuizFlow({ onBook }) {
  const [screen, setScreen] = useState(0); // 0..5 questions, 6 gate, 7 results
  const [answers, setAnswers] = useState({ ...EMPTY_ANSWERS });
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [weather, setWeather] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const gateFormRef = useRef(null);

  const onGate = screen === GATE_INDEX;
  const onResults = screen > GATE_INDEX;
  const currentQuestion = screen < QUESTIONS.length ? QUESTIONS[screen] : null;

  // Warm the next two screens' card images so they paint instantly on
  // Continue (the reference quiz's rolling preload buffer). Current screen's
  // images load eagerly via the <img> tags themselves.
  const preloadedRef = useRef(new Set());
  useEffect(() => {
    for (const q of [QUESTIONS[screen + 1], QUESTIONS[screen + 2]]) {
      if (!q) continue;
      for (const option of q.options) {
        const media = OPTION_MEDIA[`${q.key}.${option.value}`];
        if (!media?.image || preloadedRef.current.has(media.image)) continue;
        preloadedRef.current.add(media.image);
        const img = new window.Image();
        img.src = media.image;
      }
    }
  }, [screen]);

  // Weather hydrates once the gate's suburb pick supplies coordinates.
  useEffect(() => {
    if (!location.lat || !location.lng) {
      setWeather(null);
      return undefined;
    }
    const controller = new AbortController();
    fetchWeatherSummary({ lat: location.lat, lng: location.lng, signal: controller.signal })
      .then((data) => {
        if (data) setWeather(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [location.lat, location.lng]);

  const regionalIndex = location.lat && location.lng
    ? findNearestMouldRegion(location.lat, location.lng)
    : null;

  // Progress fills as steps complete; the gate screen shows the final stretch.
  const progressPct = onResults
    ? 100
    : Math.min(100, Math.round((screen / TOTAL_STEPS) * 100));

  const currentAnswered = currentQuestion ? Boolean(answers[currentQuestion.key]) : true;

  function selectOption(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function back() {
    setSubmitError("");
    setScreen((s) => Math.max(0, s - 1));
  }

  async function next() {
    if (currentQuestion) {
      if (!currentAnswered) return; // button is dimmed; ignore
      setScreen((s) => s + 1);
      return;
    }
    if (onGate) {
      await submitGate();
    }
  }

  async function submitGate() {
    const form = gateFormRef.current;
    if (!form || submitting) return;
    const data = new FormData(form);
    const { errors: nextErrors, values, isValid } = validateLead({
      firstName: data.get("firstName"),
      phone: data.get("phone"),
      email: data.get("email"),
      address: location.label,
    });
    if (!location.label.trim()) {
      nextErrors.location = "Add your suburb or postcode.";
    }

    if (!isValid || nextErrors.location) {
      setErrors(nextErrors);
      const firstInvalid = ["firstName", "phone", "email", "location"].find((key) => nextErrors[key]);
      if (firstInvalid) {
        document.getElementById(firstInvalid === "location" ? "gq-location" : `qg-${firstInvalid}`)?.focus();
      }
      return;
    }

    const result = scoreQuiz({ answers, weather, regionalIndex });
    const answerSummary = QUESTIONS.map((q) => `${q.eyebrow}: ${answers[q.key] ?? "—"}`).join(", ");

    setErrors({});
    setSubmitError("");
    setSubmitting(true);
    const outcome = await submitLead(
      {
        audience: String(data.get("audience") || "tenant"),
        ...values,
        // Only send geocode fields the autocomplete actually filled — empty
        // strings coerce to 0 in the API's Number() and save as lat/lng 0,0.
        postcode: location.postcode || undefined,
        placeId: location.placeId || undefined,
        lat: location.lat || undefined,
        lng: location.lng || undefined,
        detail: `Mould risk quiz — score ${result.score}/100 (${result.level.label}). Suburb: ${location.label}. ${answerSummary}.`,
      },
      { form: "quiz" },
    );
    setSubmitting(false);

    if (outcome.ok) {
      setScreen(GATE_INDEX + 1);
    } else {
      setSubmitError(
        "Sorry — we couldn't save that just now. Please try again, or call us on 1300 SPORE.",
      );
    }
  }

  function handleGateInput(event) {
    const key = event.target?.name;
    if (!key || !errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const nextLabel = onGate ? "Show my result" : "Continue";

  return (
    <div className="gq-flow">
      <main className="gq-main">
        {currentQuestion ? (
          <div className="gq-screen" key={currentQuestion.key}>
            <Eyebrow className="gq-eyebrow">Sporetrust Mould Risk Assessment</Eyebrow>
            <h2 className="gq-title">{currentQuestion.title}</h2>
            {currentQuestion.lede ? <p className="gq-lede">{currentQuestion.lede}</p> : null}

            <div className="gq-options" role="radiogroup" aria-label={currentQuestion.title}>
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.key] === option.value;
                const media = OPTION_MEDIA[`${currentQuestion.key}.${option.value}`] || { neutral: true };
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`gq-card${selected ? " gq-card--selected" : ""}`}
                    onClick={() => selectOption(currentQuestion.key, option.value)}
                  >
                    <span className={`gq-card__media${media.neutral ? " gq-card__media--neutral" : ""}`} aria-hidden="true">
                      {media.neutral ? (
                        <span className="gq-card__neutral-label">Not sure</span>
                      ) : (
                        <img src={media.image} alt="" />
                      )}
                    </span>
                    <span className="gq-card__body">
                      <span className={`gq-option-dot${selected ? " gq-option-dot--on" : ""}`} aria-hidden="true">
                        {selected ? (
                          <svg viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="gq-card__text">
                        <span className="gq-card__title">{option.title}</span>
                        <span className="gq-card__sub">{option.sub}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : onGate ? (
          <div className="gq-screen gq-screen--gate" key="gate">
            <Eyebrow className="gq-eyebrow">Your result is ready</Eyebrow>
            <h2 className="gq-title">Unlock your mould risk score.</h2>
            <p className="gq-lede">
              See your score and the plain-English read for your home — and a certified
              inspector can walk you through what it means. Free, no obligation.
            </p>

            <form
              ref={gateFormRef}
              className="gq-gate"
              onSubmit={(e) => {
                e.preventDefault();
                void submitGate();
              }}
              onInput={handleGateInput}
              noValidate
            >
              <div className="lead-form__field">
                <span className="lead-form__label" id="qg-audience-label">I am a:</span>
                <div className="lead-form__split" role="radiogroup" aria-labelledby="qg-audience-label">
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
              <div className="quiz-gate__row">
                <div className={`lead-form__field${errors.firstName ? " has-error" : ""}`}>
                  <label className="lead-form__label" htmlFor="qg-firstName">First name</label>
                  <input
                    className="lead-form__input"
                    id="qg-firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    aria-invalid={errors.firstName ? true : undefined}
                    aria-describedby={errors.firstName ? "qg-firstName-error" : undefined}
                  />
                  {errors.firstName ? (
                    <p className="lead-form__error" id="qg-firstName-error">{errors.firstName}</p>
                  ) : null}
                </div>
                <div className={`lead-form__field${errors.phone ? " has-error" : ""}`}>
                  <label className="lead-form__label" htmlFor="qg-phone">Phone</label>
                  <PhoneInput
                    id="qg-phone"
                    name="phone"
                    required
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? "qg-phone-error" : undefined}
                  />
                  {errors.phone ? (
                    <p className="lead-form__error" id="qg-phone-error">{errors.phone}</p>
                  ) : null}
                </div>
              </div>
              <div className={`lead-form__field${errors.email ? " has-error" : ""}`}>
                <label className="lead-form__label" htmlFor="qg-email">Email</label>
                <input
                  className="lead-form__input"
                  id="qg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "qg-email-error" : undefined}
                />
                {errors.email ? (
                  <p className="lead-form__error" id="qg-email-error">{errors.email}</p>
                ) : null}
              </div>
              <div className={`lead-form__field${errors.location ? " has-error" : ""}`}>
                <PostcodeAutocomplete
                  id="gq-location"
                  name="quiz-postcode"
                  label="Suburb or postcode"
                  placeholder="e.g. Paddington 4064"
                  value={location.label}
                  onLocation={(loc) => {
                    setLocation({ ...EMPTY_LOCATION, ...loc });
                    setErrors((prev) => {
                      if (!prev.location) return prev;
                      const next = { ...prev };
                      delete next.location;
                      return next;
                    });
                  }}
                />
                {errors.location ? (
                  <p className="lead-form__error">{errors.location}</p>
                ) : null}
              </div>
              {submitError ? (
                <p className="lead-form__error" role="alert">{submitError}</p>
              ) : null}
              <p className="quiz-gate__note">
                No spam, no lock-in — we&rsquo;ll never share your details.
              </p>
              {/* Enter submits; the visible submit is the footer button. */}
              <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
          </div>
        ) : (
          <div className="gq-screen gq-screen--results" key="results">
            <ResultsStep answers={answers} weather={weather} regionalIndex={regionalIndex} />
            <BreakdownCard answers={answers} weather={weather} regionalIndex={regionalIndex} />
            <ResultsBanner
              suburbLabel={location.label}
              onBook={() => onBook?.(location)}
            />
          </div>
        )}
      </main>

      {!onResults ? (
        <footer className="gq-footer">
          <span className="gq-footer__progress" style={{ width: `${progressPct}%` }} aria-hidden="true" />
          <div className="gq-footer__inner">
            {screen > 0 ? (
              <button type="button" className="gq-footer__back" onClick={back} disabled={submitting}>
                <ArrowIcon />
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={`quiz-step__continue gq-footer__next${!currentAnswered && !onGate ? " gq-footer__next--dim" : ""}`}
              onClick={() => void next()}
              disabled={submitting}
            >
              {submitting ? "Unlocking…" : nextLabel}
              <ArrowIcon />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
