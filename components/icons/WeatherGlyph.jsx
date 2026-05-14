function Clear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

function Cloudy() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 17a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 16.5 17H7.5Z" />
    </svg>
  );
}

function Rain() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 14a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 16.5 14H7.5Z" />
      <path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3" />
    </svg>
  );
}

function Storm() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 13a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 16.5 13H7.5Z" />
      <path d="M12 14l-2 4h3l-2 4" />
    </svg>
  );
}

function Snow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 14a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 16.5 14H7.5Z" />
      <path d="M9 18v3M13 18v3M17 18v3" />
    </svg>
  );
}

const REGISTRY = {
  clear: Clear,
  cloudy: Cloudy,
  rain: Rain,
  snow: Snow,
  storm: Storm,
};

export default function WeatherGlyph({ category }) {
  const Component = REGISTRY[category] || Cloudy;
  return (
    <span className="weather-glyph" aria-hidden="true">
      <Component />
    </span>
  );
}
