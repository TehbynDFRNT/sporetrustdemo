function DonutDiagram({ percent = 50 }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;

  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        className="stat__diagram-figure"
      >
        {percent}%
      </text>
    </svg>
  );
}

function ClockDiagram({ minutes = 60, max = 120 }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = (minutes / max) * circumference;

  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 60 60)"
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="28"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="60"
        x2="84"
        y2="60"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <circle cx="60" cy="60" r="3" fill="var(--ink)" />
    </svg>
  );
}

function ReportDiagram({ hours = 48 }) {
  const ticks = Array.from({ length: 9 });
  const filled = Math.min(1, hours / 72);
  const filledWidth = 88 * filled;

  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <g transform="translate(16 40)">
        <rect x="0" y="0" width="88" height="40" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
        <rect x="0" y="0" width={filledWidth} height="40" rx="4" fill="var(--green-soft)" opacity="0.6" />
        <g stroke="currentColor" strokeOpacity="0.25" strokeWidth="1">
          {ticks.map((_, i) => (
            <line key={i} x1={(88 / 8) * i} y1="36" x2={(88 / 8) * i} y2="44" />
          ))}
        </g>
        <text x="0" y="58" className="stat__diagram-tick">0h</text>
        <text x="88" y="58" textAnchor="end" className="stat__diagram-tick">72h</text>
        <line
          x1={filledWidth}
          y1="-6"
          x2={filledWidth}
          y2="46"
          stroke="var(--green)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x={filledWidth} y="-10" textAnchor="middle" className="stat__diagram-figure stat__diagram-figure--small">
          {hours}h
        </text>
      </g>
    </svg>
  );
}

const DIAGRAMS = {
  donut: DonutDiagram,
  clock: ClockDiagram,
  report: ReportDiagram,
};

function StatCard({ stat, index }) {
  const Diagram = DIAGRAMS[stat.diagram];

  return (
    <article className="stat" style={{ "--stat-index": index }}>
      <div className="stat__media">
        {Diagram ? <Diagram {...(stat.diagramProps || {})} /> : null}
      </div>
      <div className="stat__body">
        <span className="stat__index">{String(index + 1).padStart(2, "0")} / {stat.tag}</span>
        <h3 className="stat__figure">{stat.figure}</h3>
        <p className="stat__label">{stat.label}</p>
        {stat.source ? <p className="stat__source">{stat.source}</p> : null}
      </div>
    </article>
  );
}

export default function StatRow({ stats = [], className = "" }) {
  return (
    <div className={`stat-row${className ? ` ${className}` : ""}`}>
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} index={index} />
      ))}
    </div>
  );
}
