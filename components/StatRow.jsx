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

function WallSectionDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      {/* Outer wall outline */}
      <rect
        x="16"
        y="22"
        width="88"
        height="76"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.6"
      />
      {/* Cavity layer (dashed inner border to suggest hidden) */}
      <line x1="34" y1="22" x2="34" y2="98" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="86" y1="22" x2="86" y2="98" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 3" />
      {/* Surface tick marks (top/bottom edges) */}
      <line x1="16" y1="22" x2="104" y2="22" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <line x1="16" y1="98" x2="104" y2="98" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      {/* Hidden moisture droplets in the cavity */}
      <circle cx="48" cy="42" r="3.5" fill="var(--green)" />
      <circle cx="72" cy="58" r="2.8" fill="var(--green)" />
      <circle cx="56" cy="78" r="3" fill="var(--green)" />
      <text
        x="60"
        y="113"
        textAnchor="middle"
        className="stat__diagram-tick"
      >
        cavity
      </text>
    </svg>
  );
}

function RootCauseDiagram() {
  const cols = [20, 40, 60, 80, 100];
  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <text x="60" y="16" textAnchor="middle" className="stat__diagram-tick">patch</text>

      {/* Two rows of grey circles — surface signs */}
      <g fill="currentColor" fillOpacity="0.28">
        {cols.map((x) => (
          <circle key={`a-${x}`} cx={x} cy={30} r={5} />
        ))}
        {cols.map((x) => (
          <circle key={`b-${x}`} cx={x} cy={48} r={5} />
        ))}
      </g>

      {/* Dividing line */}
      <line
        x1="12"
        y1="66"
        x2="108"
        y2="66"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />

      {/* Three green circles — actual causes */}
      <g fill="var(--green)">
        <circle cx={36} cy={88} r={7} />
        <circle cx={60} cy={88} r={7} />
        <circle cx={84} cy={88} r={7} />
      </g>

      <text x="60" y="112" textAnchor="middle" className="stat__diagram-tick">source</text>
    </svg>
  );
}

function RecurrenceDiagram({ percent = 40 }) {
  const r = 42;
  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <path
        d={`M 60 ${60 - r} A ${r} ${r} 0 1 1 ${60 - r} 60`}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="18,52 11,64 25,64" fill="var(--green)" />
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

function CostBarsDiagram() {
  const bars = [
    { label: "Water", height: 78, accent: true },
    { label: "Fire", height: 48, accent: false },
    { label: "Burglary", height: 22, accent: false },
  ];
  const barWidth = 18;
  const gap = 12;
  const totalWidth = bars.length * barWidth + (bars.length - 1) * gap;
  const startX = (120 - totalWidth) / 2;
  const baseline = 92;

  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <line
        x1="14"
        y1={baseline}
        x2="106"
        y2={baseline}
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      {bars.map((bar, i) => {
        const x = startX + i * (barWidth + gap);
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={baseline - bar.height}
              width={barWidth}
              height={bar.height}
              fill={bar.accent ? "var(--green)" : "currentColor"}
              fillOpacity={bar.accent ? 1 : 0.2}
              rx="1.5"
            />
            <text
              x={x + barWidth / 2}
              y={baseline + 11}
              textAnchor="middle"
              className="stat__diagram-tick"
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AlertDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <path
        d="M60 28 L98 92 a5 5 0 0 1 -4.3 7.5 H26.3 a5 5 0 0 1 -4.3 -7.5 Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="60" y1="54" x2="60" y2="76" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="86" r="2.6" fill="var(--green)" />
    </svg>
  );
}

function InvoiceDiagram() {
  return (
    <svg viewBox="0 0 120 120" className="stat__diagram" aria-hidden="true">
      <rect x="38" y="24" width="40" height="72" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
      <line x1="47" y1="40" x2="69" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="47" y1="51" x2="69" y2="51" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="47" y1="62" x2="61" y2="62" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="80" r="15" fill="var(--paper)" stroke="var(--green)" strokeWidth="2" />
      <text x="80" y="81" textAnchor="middle" dominantBaseline="central" className="stat__diagram-figure stat__diagram-figure--small" fill="var(--green)">$</text>
    </svg>
  );
}

const DIAGRAMS = {
  donut: DonutDiagram,
  clock: ClockDiagram,
  report: ReportDiagram,
  wallSection: WallSectionDiagram,
  rootCause: RootCauseDiagram,
  recurrence: RecurrenceDiagram,
  costBars: CostBarsDiagram,
  alert: AlertDiagram,
  invoice: InvoiceDiagram,
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

export default function StatRow({ stats = [], variant, className = "" }) {
  const variantClass = variant ? ` stat-row--${variant}` : "";
  return (
    <div className={`stat-row${variantClass}${className ? ` ${className}` : ""}`}>
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} index={index} />
      ))}
    </div>
  );
}
