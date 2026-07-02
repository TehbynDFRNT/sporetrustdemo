/* /mould-risk-check — the GATED quiz as a paid-media landing page test.
   Identical takeover flow to /quiz, except the globally-mounted QuizTakeover
   inserts a lead-capture gate between the last question and the results
   screen (detected by this pathname). Same pattern as /quiz: the takeover
   opens itself on this route, so the page is metadata + a plain backdrop. */

export const metadata = {
  title: "Free 30-second mould risk check · Sporetrust",
  description:
    "Answer six quick questions about your home for an instant mould-risk score — suburb, recent weather, what you've noticed and your home's history. Free, no obligation. Brisbane & South-East Queensland.",
  alternates: {
    canonical: "/mould-risk-check",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Find your home's mould risk in 30 seconds",
    description:
      "An instant mould-risk score from your suburb, the weather, what you've noticed and your home's history. Free, no obligation.",
  },
};

export default function MouldRiskCheckPage() {
  return <main className="quiz-route" aria-hidden="true" />;
}
