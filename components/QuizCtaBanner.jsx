import ArrowIcon from "./icons/ArrowIcon";

const DEMO_BREAKDOWN = [
  { label: "Local conditions", points: 18, max: 25 },
  { label: "Leaks & damp", points: 14, max: 25 },
  { label: "Visible spotting", points: 16, max: 20 },
  { label: "Health signals", points: 7, max: 10 },
];

export default function QuizCtaBanner({
  eyebrow = "30-second self-check",
  title = "See your home's mould risk score — tailored to your suburb.",
  cta = "Take the Mould Risk Assessment",
  demoScore = 73,
  demoLevel = { id: "elevated", label: "Elevated risk" },
  demoBreakdown = DEMO_BREAKDOWN,
  stacked = false,
  className = "",
}) {
  const cls = [
    "quiz-cta-banner",
    stacked ? "quiz-cta-banner--stacked" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <aside className={cls}>
      <div className="quiz-cta-banner__lead">
        <span className="quiz-cta-banner__eyebrow">[ {eyebrow} ]</span>
        <p className="quiz-cta-banner__title">{title}</p>
      </div>

      <div
        className={`quiz-cta-banner__score quiz-cta-banner__score--${demoLevel.id}`}
        aria-hidden="true"
      >
        <div className="quiz-cta-banner__score-head">
          <div className="quiz-cta-banner__score-row">
            <span className="quiz-cta-banner__score-num">{demoScore}</span>
            <span className="quiz-cta-banner__score-denom">/ 100</span>
          </div>
          <span className="quiz-cta-banner__score-pill">{demoLevel.label}</span>
        </div>

        {demoBreakdown && demoBreakdown.length ? (
          <ul className="quiz-cta-banner__breakdown">
            {demoBreakdown.map((row) => (
              <li key={row.label} className="quiz-cta-banner__bd-row">
                <div className="quiz-cta-banner__bd-head">
                  <span className="quiz-cta-banner__bd-label">{row.label}</span>
                  <span className="quiz-cta-banner__bd-points">
                    <strong>{row.points}</strong> / {row.max}
                  </span>
                </div>
                <div className="quiz-cta-banner__bd-bar">
                  <span
                    className="quiz-cta-banner__bd-fill"
                    style={{ width: `${row.max > 0 ? (row.points / row.max) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <a className="quiz-cta-banner__cta" href="#quiz">
        <span>{cta}</span>
        <ArrowIcon />
      </a>
    </aside>
  );
}
