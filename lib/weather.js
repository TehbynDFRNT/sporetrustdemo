const WET_DAY_THRESHOLD_MM = 1;
const PAST_DAYS = 60;

const WMO_LABELS = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Storm with hail",
  99: "Storm with hail",
};

export function weatherCategory(code) {
  if (code == null) return "unknown";
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3 || code === 45 || code === 48) return "cloudy";
  if (code >= 51 && code <= 67) return "rain";
  if ((code >= 80 && code <= 82) || (code >= 61 && code <= 65)) return "rain";
  if (code >= 71 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "unknown";
}

export async function fetchWeatherSummary({ lat, lng, signal } = {}) {
  if (!lat || !lng) return null;

  const params = new URLSearchParams({
    latitude: Number(lat).toFixed(4),
    longitude: Number(lng).toFixed(4),
    past_days: String(PAST_DAYS),
    forecast_days: "0",
    daily: "precipitation_sum",
    current: "temperature_2m,weather_code,precipitation",
    timezone: "Australia/Brisbane",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status}).`);
  }

  const payload = await response.json();
  const dailyRain = Array.isArray(payload?.daily?.precipitation_sum)
    ? payload.daily.precipitation_sum
    : [];

  const recentDays = dailyRain.slice(-PAST_DAYS);
  const wetDays = recentDays.filter(
    (mm) => typeof mm === "number" && mm >= WET_DAY_THRESHOLD_MM
  ).length;

  const code = payload?.current?.weather_code;
  const temp = Number(payload?.current?.temperature_2m);

  return {
    wetDays,
    pastDays: recentDays.length,
    currentTemp: Number.isFinite(temp) ? Math.round(temp) : null,
    currentCode: typeof code === "number" ? code : null,
    currentLabel: WMO_LABELS[code] || "Now",
    currentCategory: weatherCategory(code),
  };
}
