"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ArrowIcon from "./icons/ArrowIcon";
import Brand from "./Brand";
import Eyebrow from "./Eyebrow";
import FeatureCard from "./FeatureCard";
import PostcodeAutocomplete from "./PostcodeAutocomplete";
import TrustBadge from "./TrustBadge";
import { trustBadges } from "../lib/landingContent";
import { fetchWeatherSummary } from "../lib/weather";
import { findNearestMouldRegion, locationRiskLevel } from "../lib/mouldIndex";
import { scoreQuiz } from "../lib/quizScoring";
import { useModalHistory } from "./useModalHistory";

const OPEN_BOOKING_EVENT = "sporetrust:open-booking";

const LOCATION_BENEFITS = [
  "No email needed to start",
  "Suburb-specific — climate, building stock, season",
  "Risk read with plain-English next steps",
];

const QUESTIONS = [
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

const OPEN_QUIZ_EVENT = "sporetrust:open-quiz";

const EMPTY_LOCATION = { label: "", postcode: "", placeId: "", lat: "", lng: "" };
const EMPTY_ANSWERS = Object.fromEntries(QUESTIONS.map((q) => [q.key, null]));

function freshState() {
  return { step: 1, location: EMPTY_LOCATION, answers: { ...EMPTY_ANSWERS } };
}

export default function QuizTakeover() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(freshState);
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState("idle");
  const returnFocusRef = useRef(null);
  // /quiz is the quiz's own route: open while on it, route home on close. The
  // route itself is the history entry, so the modal-history hook stays off here.
  const pathname = usePathname();
  const router = useRouter();
  const isQuizRoute = pathname === "/quiz";
  const routeOpenedRef = useRef(false);

  useEffect(() => {
    function openQuiz() {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    }

    function handleClick(event) {
      const trigger = event.target?.closest?.('a[href="#quiz"], [data-quiz-trigger]');

      if (!trigger) return;

      event.preventDefault();
      openQuiz();
    }

    function handleOpenEvent() {
      openQuiz();
    }

    document.addEventListener("click", handleClick);
    window.addEventListener(OPEN_QUIZ_EVENT, handleOpenEvent);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener(OPEN_QUIZ_EVENT, handleOpenEvent);
    };
  }, []);

  // Route is the source of truth on /quiz: open when we land on it, and close
  // again if the route changes out from under an open quiz (e.g. browser back).
  useEffect(() => {
    if (isQuizRoute) {
      routeOpenedRef.current = true;
      setOpen(true);
    } else if (routeOpenedRef.current) {
      routeOpenedRef.current = false;
      setOpen(false);
      setState(freshState());
      setWeather(null);
      setWeatherStatus("idle");
    }
  }, [isQuizRoute]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event) {
      if (event.key === "Escape") {
        closeQuiz();
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

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

  function closeQuiz() {
    setOpen(false);
    setState(freshState());
    setWeather(null);
    setWeatherStatus("idle");
    // On the /quiz route, closing means leaving the route — send them home
    // (the route, not a modal-history entry, is what "back" pops here).
    if (isQuizRoute) {
      routeOpenedRef.current = false;
      router.push("/");
      return;
    }
    window.requestAnimationFrame(() => returnFocusRef.current?.focus?.());
  }

  // Modal-history is only for in-page (modal) opens; /quiz uses real routing.
  useModalHistory(open && !isQuizRoute, closeQuiz);

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

  function bookFromQuiz() {
    const location = state.location;
    setOpen(false);
    setState(freshState());
    setWeather(null);
    setWeatherStatus("idle");
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { location } }));
    });
  }

  if (!open) return null;

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

  return (
    <div className="quiz-takeover" role="dialog" aria-modal="true" aria-label="Mould self-check">
      <header className="quiz-takeover-chrome">
        <Brand />
        <button type="button" className="quiz-takeover-close" onClick={closeQuiz} aria-label="Close self-check">
          Close
        </button>
      </header>

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
            <ResultsStep
              answers={state.answers}
              weather={weather}
              regionalIndex={regionalIndex}
            />
          ) : (
            <PlaceholderStep step={state.step} />
          )}
        </div>

        {onResults ? (
          <>
            <BreakdownCard
              answers={state.answers}
              weather={weather}
              regionalIndex={regionalIndex}
            />
            <ResultsBanner
              suburbLabel={state.location.label}
              onBook={bookFromQuiz}
            />
          </>
        ) : null}
      </div>
    </div>
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
