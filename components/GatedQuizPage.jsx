"use client";

import { useEffect } from "react";
import Brand from "./Brand";
import QuizFlow from "./QuizFlow";
import { captureAttribution } from "../lib/leadSubmit";

const OPEN_BOOKING_EVENT = "sporetrust:open-booking";

/* /mould-risk-check — the gated quiz rendered AS the page, not as the
   overlay. The overlay (QuizTakeover) only appears after hydration, which
   flashes the standard site chrome first; here the quiz IS the server-rendered
   page content, and globals.css hides the site chrome via body:has() the
   moment CSS paints. Reuses the .quiz-takeover* styles through the --page
   modifier (static positioning instead of fixed). */
export default function GatedQuizPage() {
  // Bank UTM/click-id params on arrival so the gate's lead submit can
  // attribute back to the ad.
  useEffect(() => {
    captureAttribution();
  }, []);

  function bookFromQuiz(location) {
    window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { location } }));
  }

  return (
    <div className="quiz-takeover quiz-takeover--page" aria-label="Mould risk check">
      <header className="quiz-takeover-chrome">
        <Brand />
      </header>

      <QuizFlow gated onBook={bookFromQuiz} />
    </div>
  );
}
