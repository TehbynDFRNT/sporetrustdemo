"use client";

import { useEffect } from "react";

/* Stable-URL entry point for the mould self-check. The quiz itself is the
   globally-mounted QuizTakeover (app/layout.jsx) — this page just opens it on
   mount via the same custom event the in-page triggers use, so /quiz becomes a
   linkable, ad-targetable destination without duplicating the quiz UI.

   The splash sits behind the takeover: it's what the visitor sees if they
   close the quiz (the takeover's useModalHistory already routes the back
   button to close), giving them a re-open button and a way back to the site
   instead of a blank page. The rAF defers the open event until after every
   mount effect has run, so the takeover's listener is guaranteed attached. */

export default function QuizLauncher() {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("sporetrust:open-quiz"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="quiz-splash">
      <div className="quiz-splash__inner">
        <span className="eyebrow">[ mould self-check ]</span>
        <h1>Find your home&rsquo;s mould risk in 2 minutes.</h1>
        <p className="lede">
          A few questions about your suburb, the recent weather, what you&rsquo;ve noticed and your
          home&rsquo;s history — for an instant risk read. Free, no obligation.
        </p>
        <button type="button" className="btn" data-quiz-trigger>
          Start the self-check
        </button>
        <a className="quiz-splash__back" href="/">
          Back to Sporetrust
        </a>
      </div>
    </main>
  );
}
