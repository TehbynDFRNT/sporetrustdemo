import QuizLauncher from "./QuizLauncher";

/* /quiz — stable, linkable URL for the mould self-check (the ungated quiz).
   Server component holds the metadata; QuizLauncher (client) opens the
   globally-mounted takeover on mount. */

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
  return <QuizLauncher />;
}
