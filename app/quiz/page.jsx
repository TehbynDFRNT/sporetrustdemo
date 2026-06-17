/* /quiz — the mould self-check at its own route. The globally-mounted
   QuizTakeover (app/layout.jsx) opens itself whenever the path is /quiz and
   routes home on close, so this page only needs to hold the metadata and a
   plain backdrop behind the takeover (no splash, no duplicated quiz UI). */

export const metadata = {
  title: "Mould risk self-check · Sporetrust",
  description:
    "Answer a few quick questions about your home for an instant mould-risk read — suburb, recent weather, what you've noticed and your home's history. Free, no obligation. Brisbane & South-East Queensland.",
  alternates: {
    canonical: "/quiz",
  },
  openGraph: {
    title: "Find your home's mould risk in 2 minutes",
    description:
      "An instant mould-risk read from your suburb, the weather, what you've noticed and your home's history. Free, no obligation.",
  },
};

export default function QuizPage() {
  return <main className="quiz-route" aria-hidden="true" />;
}
