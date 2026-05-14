import { MOULD_INDEX_MIN, MOULD_INDEX_MAX } from "./mouldIndex";

const QUESTION_WEIGHTS = {
  leak: { _max: 15, none: 0, minor: 6, major: 14, unsure: 5 },
  damp: { _max: 10, none: 0, suspect: 4, confirmed: 9, unsure: 3 },
  spotting: { _max: 20, none: 0, one: 8, multiple: 18, unsure: 5 },
  smells: { _max: 20, none: 0, occasional: 8, persistent: 18, unsure: 6 },
  health: { _max: 10, none: 0, sometimes: 5, home: 8, ongoing: 10 },
  history: { _max: 10, none: 0, diy: 8, professional: 8, recurring: 10 },
};

const WEATHER_MAX = 10;
const LOCATION_MAX = 15;

const WEATHER_BANDS = [
  { min: 40, points: 10 },
  { min: 30, points: 9 },
  { min: 25, points: 8 },
  { min: 20, points: 7 },
  { min: 15, points: 5 },
  { min: 10, points: 2 },
];

const LEVELS = [
  {
    id: "low",
    min: 0,
    label: "Low risk",
    headline: "Few mould pressure signals — stay alert to changes.",
    nudge: "A diagnostic gives you a baseline to compare against in future seasons.",
  },
  {
    id: "moderate",
    min: 21,
    label: "Moderate risk",
    headline: "Some indicators worth investigating before they grow.",
    nudge: "A targeted diagnostic can confirm whether what you're seeing is the surface of something bigger.",
  },
  {
    id: "elevated",
    min: 51,
    label: "Elevated risk",
    headline: "Multiple indicators — on-site testing is the right next step.",
    nudge: "We can confirm cause, extent and a defensible repair pathway before the conversation moves on.",
  },
  {
    id: "high",
    min: 76,
    label: "High risk",
    headline: "Strong indicators across multiple signals.",
    nudge: "Book a diagnostic this week — the longer affected materials stay wet, the larger the eventual scope.",
  },
];

function weatherPoints(weather) {
  if (!weather || typeof weather.wetDays !== "number") return 0;
  const band = WEATHER_BANDS.find((b) => weather.wetDays >= b.min);
  return band ? band.points : 0;
}

function locationPoints(regionalIndex) {
  if (!regionalIndex || typeof regionalIndex.index_score !== "number") return 0;
  const span = MOULD_INDEX_MAX - MOULD_INDEX_MIN;
  if (span <= 0) return 0;
  const normalised = (regionalIndex.index_score - MOULD_INDEX_MIN) / span;
  return Math.round(Math.max(0, Math.min(1, normalised)) * LOCATION_MAX);
}

export function scoreQuiz({ answers = {}, weather = null, regionalIndex = null } = {}) {
  let total = 0;
  const breakdown = {};

  for (const [key, weights] of Object.entries(QUESTION_WEIGHTS)) {
    const answer = answers[key];
    const points = answer != null && weights[answer] != null ? weights[answer] : 0;
    breakdown[key] = { answer, points, max: weights._max };
    total += points;
  }

  const includeWeather = !!weather;
  const wPoints = weatherPoints(weather);
  if (includeWeather) {
    breakdown.weather = { wetDays: weather.wetDays, points: wPoints, max: WEATHER_MAX };
    total += wPoints;
  }

  const includeLocation = !!regionalIndex;
  const lPoints = locationPoints(regionalIndex);
  if (includeLocation) {
    breakdown.location = {
      region: regionalIndex.region,
      state: regionalIndex.state,
      indexScore: regionalIndex.index_score,
      points: lPoints,
      max: LOCATION_MAX,
    };
    total += lPoints;
  }

  const max =
    Object.values(QUESTION_WEIGHTS).reduce((sum, w) => sum + w._max, 0) +
    (includeWeather ? WEATHER_MAX : 0) +
    (includeLocation ? LOCATION_MAX : 0);

  const score = Math.round((total / max) * 100);
  const level = [...LEVELS].reverse().find((l) => score >= l.min) || LEVELS[0];

  return { score, raw: total, max, level, breakdown };
}
