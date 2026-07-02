"use client";

import { useEffect, useMemo, useState } from "react";
import ArrowIcon from "./icons/ArrowIcon";
import Eyebrow from "./Eyebrow";
import FeatureCard from "./FeatureCard";
import PhoneInput from "./PhoneInput";
import PostcodeAutocomplete from "./PostcodeAutocomplete";
import TrustBadge from "./TrustBadge";
import { trustBadges } from "../lib/landingContent";
import { fetchWeatherSummary } from "../lib/weather";
import { findNearestMouldRegion, locationRiskLevel } from "../lib/mouldIndex";
import { scoreQuiz } from "../lib/quizScoring";
import { submitLead, validateLead } from "../lib/leadSubmit";

/* The quiz itself — location step → six questions → (optional lead gate) →
   results. Extracted from QuizTakeover so it can render either inside the
   overlay (organic /quiz + #quiz triggers) or directly as page content
   (/mould-risk-check, the gated paid lander) without the overlay's
   mount-after-hydration flash. Overlay concerns (open/close, scroll lock,
   chrome) live in the wrapper; this component owns state + steps + scoring.

   Props:
   - gated:  insert GateStep between the last question and results; the score
             stays withheld until the lead form saves.
   - onBook: called with the quiz location when the results banner CTA is
             clicked (wrappers decide how to hand off to BookingTakeover). */

const LOCATION_BENEFITS = [
  "No email needed to start",
  "Suburb-specific — climate, building stock, season",
  "Risk read with plain-English next steps",
];

export const QUESTIONS = [
  {
    key: "leak",
    eyebrow: "Recent leaks",
    title: "Any minor or major leaks in the last 3 months?",
    lede: "Burst pipes, roof leaks, plumbing weeps and shower-base failures all count.",
    options: [
      { value: "none", title: "No", sub: "Nothing visible or known recently." },
      { value: "minor", title: "Yes — minor", sub: "Slow drip, weep, small spill, gutter overflow." },
      { value: "major", title: "Yes — major", sub: "Burst pipe, flooding, roof leak, storm ingress." },
      { value: "unsure", title: "Not sure", sub: "Possibly missed it — check the home regularly." },
    ],
  },
  {
    key: "damp",
    eyebrow: "Damp signs",
    title: "Do you suspect or know about damp?",
    lede: "Persistent moisture, condensation on windows, swollen skirtings or peeling paint.",
    options: [
      { value: "none", title: "No", sub: "Nothing damp-related." },
      { value: "suspect", title: "Suspect", sub: "Hunch, but no clear sign yet." },
      { value: "confirmed", title: "Know about it", sub: "Visible damp signs in the home." },
      { value: "unsure", title: "Not sure", sub: "Hard to tell where to look." },
    ],
  },
  {
    key: "spotting",
    eyebrow: "Visible spotting",
    title: "Spotting on clothes, walls or appliances?",
    lede: "Black or dark specks on stored fabrics, grout, ceilings, AC vents or cabinetry.",
    options: [
      { value: "none", title: "No", sub: "Nothing visible to the eye." },
      { value: "one", title: "One spot", sub: "One area I've noticed." },
      { value: "multiple", title: "Multiple spots", sub: "Several places around the home." },
      { value: "unsure", title: "Not sure", sub: "Haven't looked closely." },
    ],
  },
  {
    key: "smells",
    eyebrow: "Smells & air",
    title: "Persistent smells, odour or heavy air?",
    lede: "Musty smell that won't air out, heavy or damp-feeling rooms.",
    options: [
      { value: "none", title: "No", sub: "Air feels fine." },
      { value: "occasional", title: "Sometimes", sub: "Comes and goes." },
      { value: "persistent", title: "Persistent", sub: "Musty smell that won't air out." },
      { value: "unsure", title: "Not sure", sub: "Could be drains, cooking or HVAC." },
    ],
  },
  {
    key: "health",
    eyebrow: "Health signals",
    title: "Felt unwell or off, without a clear reason?",
    lede: "Sniffles, congestion, headaches, fatigue or asthma flare-ups that feel home-linked.",
    options: [
      { value: "none", title: "No", sub: "Everyone feels fine." },
      { value: "sometimes", title: "Sometimes", sub: "Hard to say if it's the home." },
      { value: "home", title: "Worse at home", sub: "Better when away from the house." },
      { value: "ongoing", title: "Ongoing", sub: "Symptoms persist for weeks or months." },
    ],
  },
  {
    key: "history",
    eyebrow: "Past mould",
    title: "Any past mould, remediation or removal?",
    lede: "Previous treatment — DIY cleaning, professional remediation or insurance work.",
    options: [
      { value: "none", title: "No", sub: "Nothing previously." },
      { value: "diy", title: "DIY cleaned", sub: "Sprayed or scrubbed it ourselves." },
      { value: "professional", title: "Professional", sub: "Removed by a contractor." },
      { value: "recurring", title: "It came back", sub: "Treated more than once." },
    ],
  },
];

const QUESTION_STEPS = 1 + QUESTIONS.length; // location + questions
const RESULTS_STEP = QUESTION_STEPS + 1;
const TOTAL_STEPS = RESULTS_STEP; // step ceiling

function GreenCheck() {
  return (
    <svg className="compare-icon compare-icon--check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
    </svg>
  );
}

const SELL_TESTIMONIAL = trustBadges[1];

const EMPTY_LOCATION = { label: "", postcode: "", placeId: "", lat: "", lng: "" };
const EMPTY_ANSWERS = Object.fromEntries(QUESTIONS.map((q) => [q.key, null]));

function freshState() {
  return { step: 1, location: EMPTY_LOCATION, answers: { ...EMPTY_ANSWERS } };
}

export default function QuizFlow({ gated = false, onBook }) {
  const [state, setState] = useState(freshState);
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState("idle");
  // Gated flow only: results stay hidden until the lead form saves.
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!state.location.lat || !state.location.lng) {
      setWeather(null);
      setWeatherStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    setWeatherStatus("loading");

    fetchWeatherSummary({
      lat: state.location.lat,
      lng: state.location.lng,
      signal: controller.signal,
    })
      .then((data) => {
        if (!data) {
          setWeatherStatus("idle");
          return;
        }
        setWeather(data);
        setWeatherStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setWeatherStatus("error");
      });

    return () => controller.abort();
  }, [state.location.lat, state.location.lng]);

  function advance() {
    setState((current) => ({ ...current, step: Math.min(current.step + 1, TOTAL_STEPS) }));
  }

  function updateLocation(location) {
    setState((current) => ({ ...current, location: { ...EMPTY_LOCATION, ...location } }));
  }

  function recordAnswer(key, value) {
    setState((current) => ({
      ...current,
      answers: { ...current.answers, [key]: value },
      step: Math.min(current.step + 1, TOTAL_STEPS),
    }));
  }

  const progressPct = Math.min(100, Math.round((state.step / QUESTION_STEPS) * 100));
  const questionIndex = state.step - 2;
  const currentQuestion = questionIndex >= 0 && questionIndex < QUESTIONS.length
    ? QUESTIONS[questionIndex]
    : null;
  const regionalIndex = state.location.lat && state.location.lng
    ? findNearestMouldRegion(state.location.lat, state.location.lng)
    : null;
  const weatherReady = weatherStatus === "ready" && weather;
  const showSignalsOnQuestion =
    !!currentQuestion && (regionalIndex || (weatherReady && weather.wetDays > 10));
  const onResults = state.step >= RESULTS_STEP;
  const resultsRevealed = onResults && (!gated || unlocked);

  return (
    <>
      <div className="quiz-takeover-progress" aria-hidden="true">
        <div className="quiz-takeover-progress__track">
          <span className="quiz-takeover-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="quiz-takeover-body">
        <div className="quiz-takeover-stage">
          {state.step === 1 ? (
            <LocationStep
              location={state.location}
              onLocation={updateLocation}
              onContinue={advance}
            />
          ) : currentQuestion ? (
            <QuestionStep
              question={currentQuestion}
              selected={state.answers[currentQuestion.key]}
              onAnswer={(value) => recordAnswer(currentQuestion.key, value)}
              weather={showSignalsOnQuestion ? weather : null}
              regionalIndex={showSignalsOnQuestion ? regionalIndex : null}
              suburbLabel={state.location.label}
            />
          ) : onResults ? (
            gated && !unlocked ? (
              <GateStep
                location={state.location}
                answers={state.answers}
                weather={weather}
                regionalIndex={regionalIndex}
                onUnlock={() => setUnlocked(true)}
              />
            ) : (
              <ResultsStep
                answers={state.answers}
                weather={weather}
                regionalIndex={regionalIndex}
              />
            )
          ) : (
            <PlaceholderStep step={state.step} />
          )}
        </div>

        {resultsRevealed ? (
          <>
            <BreakdownCard
              answers={state.answers}
              weather={weather}
              regionalIndex={regionalIndex}
            />
            <ResultsBanner
              suburbLabel={state.location.label}
              onBook={() => onBook?.(state.location)}
            />
          </>
        ) : null}
      </div>
    </>
  );
}

function LocationStep({ location, onLocation, onContinue }) {
  const canContinue = location.label.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (canContinue) onContinue();
  }

  return (
    <form className="quiz-step quiz-step--location" onSubmit={handleSubmit}>
      <header className="quiz-step__header">
        <Eyebrow>Takes 30 seconds</Eyebrow>
        <h2 className="quiz-step__title">Get a Rapid Mould Risk Assessment.</h2>
        <p className="quiz-step__lede">
          Six quick questions, tailored to your home and suburb.
        </p>
      </header>

      <ul className="quiz-step__benefits">
        {LOCATION_BENEFITS.map((text) => (
          <li key={text}>
            <GreenCheck />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <div className="quiz-step__divider" aria-hidden="true" />

      <PostcodeAutocomplete
        id="quiz-location"
        name="quiz-postcode"
        label="Suburb or postcode"
        placeholder="e.g. Paddington 4064"
        value={location.label}
        onLocation={onLocation}
      />

      <div className="quiz-step__actions">
        <div className="quiz-step__proof">
          <TrustBadge quote={SELL_TESTIMONIAL.quote} meta={SELL_TESTIMONIAL.meta} />
        </div>
        <button type="submit" className="quiz-step__continue" disabled={!canContinue}>
          Start assessment
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}

function QuestionStep({ question, selected, onAnswer, weather, regionalIndex, suburbLabel }) {
  const hasSignals = regionalIndex || (weather && weather.wetDays > 10);

  return (
    <div className={`quiz-step quiz-step--${question.key}`}>
      {hasSignals ? (
        <LocationSignals weather={weather} regionalIndex={regionalIndex} suburbLabel={suburbLabel} />
      ) : null}

      <header className="quiz-step__header">
        <Eyebrow>{question.eyebrow}</Eyebrow>
        <h2 className="quiz-step__title">{question.title}</h2>
        {question.lede ? <p className="quiz-step__lede">{question.lede}</p> : null}
      </header>

      <div className="quiz-options" role="radiogroup" aria-label={question.title}>
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected === option.value}
            className={`quiz-option${selected === option.value ? " quiz-option--selected" : ""}`}
            onClick={() => onAnswer(option.value)}
          >
            <span className="quiz-option__title">{option.title}</span>
            <span className="quiz-option__sub">{option.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function placeShortName(label) {
  const beforeComma = String(label || "").split(",")[0].trim();
  const cleaned = beforeComma.replace(/\s+(QLD|NSW|VIC|TAS|SA|WA|NT|ACT)(\s+\d{4})?$/i, "").trim();
  return cleaned || "your suburb";
}

function LocationSignals({ weather, regionalIndex }) {
  const locationLevel = regionalIndex ? locationRiskLevel(regionalIndex.index_score) : null;
  const showWeatherWarning = weather && typeof weather.wetDays === "number" && weather.wetDays > 10;

  return (
    <aside className="quiz-step__signals" aria-live="polite">
      {regionalIndex && locationLevel ? (
        <div className="quiz-signal">
          <span className={`quiz-signal__tag quiz-signal__tag--${locationLevel.id}`}>
            {locationLevel.label} risk
          </span>
          <span className="quiz-signal__label">Location pressure</span>
          <span className="quiz-signal__value">{regionalIndex.region}</span>
        </div>
      ) : null}

      {showWeatherWarning ? (
        <div className="quiz-signal">
          <span className="quiz-signal__tag quiz-signal__tag--warning">
            Wet-weather warning
          </span>
          <span className="quiz-signal__label">Recent rain</span>
          <span className="quiz-signal__value">{weather.wetDays} wet days · last 60</span>
        </div>
      ) : null}
    </aside>
  );
}

/* Lead-capture gate (gated flow only). Sits between the last question and
   the results screen: the score is computed but withheld until the form saves.
   Reuses the lander lead plumbing — submitLead persists via /api/lead and only
   fires the Meta Lead on a confirmed save. The quiz suburb (with geocode) is
   submitted as the address, and the score + answers ride along in `detail` so
   every quiz lead lands with its risk context attached. */
function GateStep({ location, answers, weather, regionalIndex, onUnlock }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const place = placeShortName(location.label);

  function handleInput(event) {
    const key = event.target?.name;
    if (!key || !errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { errors: nextErrors, values, isValid } = validateLead({
      firstName: data.get("firstName"),
      phone: data.get("phone"),
      email: data.get("email"),
      address: location.label, // suburb from step 1 — not asked again
    });

    if (!isValid) {
      setErrors(nextErrors);
      const firstInvalid = ["firstName", "phone", "email"].find((key) => nextErrors[key]);
      if (firstInvalid) document.getElementById(`qg-${firstInvalid}`)?.focus();
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
      onUnlock();
    } else {
      setSubmitError(
        "Sorry — we couldn't save that just now. Please try again, or call us on 1300 SPORE.",
      );
    }
  }

  return (
    <div className="quiz-step quiz-step--gate">
      <header className="quiz-step__header">
        <Eyebrow>Your result is ready</Eyebrow>
        <h2 className="quiz-step__title">Unlock your mould risk score.</h2>
        <p className="quiz-step__lede">
          See your score and the plain-English read for {place} — and a certified
          inspector can walk you through what it means. Free, no obligation.
        </p>
      </header>

      <form className="quiz-gate__form" onSubmit={handleSubmit} onInput={handleInput} noValidate>
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
        <button type="submit" className="quiz-step__continue quiz-gate__submit" disabled={submitting}>
          {submitting ? "Unlocking…" : "Show my result"}
          <ArrowIcon />
        </button>
        {submitError ? (
          <p className="lead-form__error" role="alert">{submitError}</p>
        ) : null}
        <p className="quiz-gate__note">
          No spam, no lock-in — we&rsquo;ll never share your details.
        </p>
      </form>
    </div>
  );
}

function ResultsStep({ answers, weather, regionalIndex }) {
  const result = useMemo(
    () => scoreQuiz({ answers, weather, regionalIndex }),
    [answers, weather, regionalIndex]
  );

  return (
    <div className="quiz-step quiz-step--results">
      <header className="quiz-step__header quiz-result__header">
        <Eyebrow>Your result</Eyebrow>
        <div className={`quiz-result__score quiz-result__score--${result.level.id}`}>
          <span className="quiz-result__score-figure">{result.score}</span>
          <span className="quiz-result__score-denom">/ 100</span>
          <span className="quiz-result__score-label">{result.level.label}</span>
        </div>
        <h2 className="quiz-step__title">{result.level.headline}</h2>
        <p className="quiz-step__lede">{result.level.nudge}</p>
      </header>
    </div>
  );
}

function BreakdownCard({ answers, weather, regionalIndex }) {
  const result = useMemo(
    () => scoreQuiz({ answers, weather, regionalIndex }),
    [answers, weather, regionalIndex]
  );

  const rows = [];

  const w = result.breakdown.weather;
  const l = result.breakdown.location;
  if (w || l) {
    const summaryParts = [];
    if (w) summaryParts.push(`${w.wetDays} wet days in 60`);
    if (l) summaryParts.push(l.region);
    rows.push({
      key: "local",
      label: "Local conditions",
      summary: summaryParts.join(" · "),
      points: (w?.points || 0) + (l?.points || 0),
      max: (w?.max || 0) + (l?.max || 0),
    });
  }

  const moistureKeys = ["leak", "damp"];
  const moistureParts = moistureKeys
    .map((key) => {
      const question = QUESTIONS.find((q) => q.key === key);
      const b = result.breakdown[key];
      const option = question?.options.find((o) => o.value === b?.answer);
      return { question, b, option };
    })
    .filter((part) => part.b);

  if (moistureParts.length) {
    rows.push({
      key: "moisture",
      label: "Leaks & damp",
      summary: moistureParts.map((p) => p.option?.title || "—").join(" / "),
      points: moistureParts.reduce((sum, p) => sum + (p.b?.points || 0), 0),
      max: moistureParts.reduce((sum, p) => sum + (p.b?.max || 0), 0),
    });
  }

  for (const question of QUESTIONS) {
    if (moistureKeys.includes(question.key)) continue;
    const b = result.breakdown[question.key];
    const option = question.options.find((o) => o.value === b?.answer);
    rows.push({
      key: question.key,
      label: question.eyebrow,
      summary: option?.title || "—",
      points: b?.points || 0,
      max: b?.max || 0,
    });
  }

  return (
    <aside className="quiz-takeover-breakdown">
      <Eyebrow>How we got this</Eyebrow>
      <ul className="quiz-breakdown">
        {rows.map((row) => (
          <li key={row.key} className="quiz-breakdown__row">
            <div className="quiz-breakdown__head">
              <span className="quiz-breakdown__label">
                {row.label}
                <em className="quiz-breakdown__summary"> · {row.summary}</em>
              </span>
              <span className="quiz-breakdown__points">
                <strong>{row.points}</strong>
                <span> / {row.max}</span>
              </span>
            </div>
            <div className="quiz-breakdown__bar" aria-hidden="true">
              <span
                className="quiz-breakdown__bar-fill"
                style={{ width: `${row.max > 0 ? (row.points / row.max) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ResultsBanner({ suburbLabel, onBook }) {
  const place = placeShortName(suburbLabel);

  function handleBookClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onBook();
  }

  return (
    <div className="quiz-takeover-banner">
      <FeatureCard
        eyebrow="Book a diagnostic"
        title={`Confirm what's happening in ${place}.`}
        stats={[
          { figure: "45 min", label: "On-site thermal, moisture, humidity and ventilation sweep." },
          { figure: "48 hr", label: "Plain-English report with cause, extent and a defensible cost range." },
        ]}
        primaryCta={{ label: "Book inspection", href: "#", onClick: handleBookClick }}
        footnote="No callout fees · independent of remediation · IICRC certified · NATA-accredited lab analysis available."
        image="/images/book-diagnostic-banner.jpg"
        imageAlt="Sporetrust mould and moisture diagnostic"
      />
    </div>
  );
}

function PlaceholderStep({ step }) {
  return (
    <div className="quiz-step quiz-step--placeholder">
      <span className="quiz-step__eyebrow">Step {String(step).padStart(2, "0")}</span>
      <h2 className="quiz-step__title">Results coming.</h2>
      <p className="quiz-step__lede">
        The risk read screen hasn&apos;t been built yet. Close for now and check back.
      </p>
    </div>
  );
}
