import GatedQuizPage from "../../components/GatedQuizPage";

/* /mould-risk-check — the GATED quiz as a paid-media landing page test.
   Unlike /quiz (which opens the QuizTakeover overlay over a backdrop page),
   this route renders the quiz directly as server-rendered page content so
   paid visitors never see the standard site chrome flash before the quiz
   initialises. The lead gate sits between the last question and the results
   (see components/QuizFlow.jsx GateStep). */

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
  return (
    <main>
      <GatedQuizPage />
    </main>
  );
}
