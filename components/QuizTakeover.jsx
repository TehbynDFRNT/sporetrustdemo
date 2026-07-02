"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Brand from "./Brand";
import QuizFlow from "./QuizFlow";
import { useModalHistory } from "./useModalHistory";

const OPEN_BOOKING_EVENT = "sporetrust:open-booking";
const OPEN_QUIZ_EVENT = "sporetrust:open-quiz";

/* Overlay wrapper for the quiz — the quiz itself lives in QuizFlow. This
   handles the takeover concerns only: #quiz trigger interception, the /quiz
   route (open while on it, route home on close), scroll lock, Escape, and the
   booking handoff. The gated paid lander (/mould-risk-check) renders QuizFlow
   directly as page content instead — see components/GatedQuizPage.jsx. */
export default function QuizTakeover() {
  const [open, setOpen] = useState(false);
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

  // Closing unmounts <QuizFlow/>, which resets the quiz state for next open.
  function closeQuiz() {
    setOpen(false);
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

  function bookFromQuiz(location) {
    setOpen(false);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { location } }));
    });
  }

  if (!open) return null;

  return (
    <div className="quiz-takeover" role="dialog" aria-modal="true" aria-label="Mould self-check">
      <header className="quiz-takeover-chrome">
        <Brand />
        <button type="button" className="quiz-takeover-close" onClick={closeQuiz} aria-label="Close self-check">
          Close
        </button>
      </header>

      <QuizFlow onBook={bookFromQuiz} />
    </div>
  );
}
