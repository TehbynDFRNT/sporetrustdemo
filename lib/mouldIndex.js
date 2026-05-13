// Airtasker Mould Index — SA4-region scores joined to polygon centroids
// from the Datawrapper choropleth that powers airtasker.com/au/lp/australias-mouldiest-cities/.
// Index combines response indicators (job/search demand), structural vulnerability,
// and climate risk on a 0–100 scale. cx/cy are WGS84 centroids of the SA4 polygon.
// Joined on ABS SA4_CODE21. 88 regions = full AU coverage.

export const MOULD_INDEX_MIN = 9.15;   // WA Outback (South)
export const MOULD_INDEX_MAX = 61.32;  // Sydney - Eastern Suburbs

export const MOULD_INDEX_REGIONS = [
  { rank:   1, sa4_code: 118, region: "Sydney - Eastern Suburbs", state: "NSW", lat: -33.90185, lng: 151.2408, index_score: 61.32 },
  { rank:   2, sa4_code: 306, region: "Cairns", state: "QLD", lat: -17.91761, lng: 145.54417, index_score: 60.67 },
  { rank:   3, sa4_code: 117, region: "Sydney - City and Inner South", state: "NSW", lat: -33.91649, lng: 151.1829, index_score: 58.04 },
  { rank:   4, sa4_code: 121, region: "Sydney - North Sydney and Hornsby", state: "NSW", lat: -33.71901, lng: 151.13421, index_score: 55.95 },
  { rank:   5, sa4_code: 112, region: "Richmond - Tweed", state: "NSW", lat: -28.79539, lng: 153.07604, index_score: 52.55 },
  { rank:   6, sa4_code: 122, region: "Sydney - Northern Beaches", state: "NSW", lat: -33.68319, lng: 151.23137, index_score: 52.55 },
  { rank:   7, sa4_code: 316, region: "Sunshine Coast", state: "QLD", lat: -26.66548, lng: 152.90855, index_score: 51.91 },
  { rank:   8, sa4_code: 309, region: "Gold Coast", state: "QLD", lat: -28.07809, lng: 153.27014, index_score: 51.71 },
  { rank:   9, sa4_code: 120, region: "Sydney - Inner West", state: "NSW", lat: -33.87958, lng: 151.10092, index_score: 51.52 },
  { rank:  10, sa4_code: 604, region: "West and North West", state: "TAS", lat: -41.45383, lng: 145.54583, index_score: 51.2 },
  { rank:  11, sa4_code: 701, region: "Darwin", state: "NT", lat: -12.52353, lng: 131.14372, index_score: 51.13 },
  { rank:  12, sa4_code: 126, region: "Sydney - Ryde", state: "NSW", lat: -33.79027, lng: 151.10047, index_score: 50.38 },
  { rank:  13, sa4_code: 104, region: "Coffs Harbour - Grafton", state: "NSW", lat: -29.80595, lng: 152.78573, index_score: 49.27 },
  { rank:  14, sa4_code: 108, region: "Mid North Coast", state: "NSW", lat: -31.61085, lng: 152.41757, index_score: 47.22 },
  { rank:  15, sa4_code: 301, region: "Brisbane - East", state: "QLD", lat: -27.58819, lng: 153.24136, index_score: 46.51 },
  { rank:  16, sa4_code: 111, region: "Newcastle and Lake Macquarie", state: "NSW", lat: -33.06097, lng: 151.46518, index_score: 46.42 },
  { rank:  17, sa4_code: 102, region: "Central Coast", state: "NSW", lat: -33.28395, lng: 151.26356, index_score: 45.98 },
  { rank:  18, sa4_code: 305, region: "Brisbane Inner City", state: "QLD", lat: -27.44471, lng: 153.01234, index_score: 45.79 },
  { rank:  19, sa4_code: 107, region: "Illawarra", state: "NSW", lat: -34.40814, lng: 150.7226, index_score: 45.22 },
  { rank:  20, sa4_code: 314, region: "Moreton Bay - South", state: "QLD", lat: -27.30175, lng: 152.87311, index_score: 45.08 },
  { rank:  21, sa4_code: 302, region: "Brisbane - North", state: "QLD", lat: -27.35542, lng: 153.03822, index_score: 44.91 },
  { rank:  22, sa4_code: 124, region: "Sydney - Outer West and Blue Mountains", state: "NSW", lat: -33.79313, lng: 150.40854, index_score: 44.33 },
  { rank:  23, sa4_code: 125, region: "Sydney - Parramatta", state: "NSW", lat: -33.82499, lng: 150.99803, index_score: 44.02 },
  { rank:  24, sa4_code: 304, region: "Brisbane - West", state: "QLD", lat: -27.47492, lng: 152.89986, index_score: 43.93 },
  { rank:  25, sa4_code: 115, region: "Sydney - Baulkham Hills and Hawkesbury", state: "NSW", lat: -33.34368, lng: 150.7891, index_score: 43.71 },
  { rank:  26, sa4_code: 313, region: "Moreton Bay - North", state: "QLD", lat: -26.81425, lng: 152.38205, index_score: 43.58 },
  { rank:  27, sa4_code: 114, region: "Southern Highlands and Shoalhaven", state: "NSW", lat: -35.00183, lng: 150.39575, index_score: 43.46 },
  { rank:  28, sa4_code: 128, region: "Sydney - Sutherland", state: "NSW", lat: -34.10631, lng: 151.03555, index_score: 43.17 },
  { rank:  29, sa4_code: 311, region: "Logan - Beaudesert", state: "QLD", lat: -28.05718, lng: 152.95832, index_score: 42.95 },
  { rank:  30, sa4_code: 211, region: "Melbourne - Outer East", state: "VIC", lat: -37.71413, lng: 145.53436, index_score: 42.66 },
  { rank:  31, sa4_code: 303, region: "Brisbane - South", state: "QLD", lat: -27.56517, lng: 153.05354, index_score: 42.44 },
  { rank:  32, sa4_code: 119, region: "Sydney - Inner South West", state: "NSW", lat: -33.94379, lng: 151.0824, index_score: 41.92 },
  { rank:  33, sa4_code: 123, region: "Sydney - Outer South West", state: "NSW", lat: -34.13555, lng: 150.58699, index_score: 41.55 },
  { rank:  34, sa4_code: 319, region: "Wide Bay", state: "QLD", lat: -25.58917, lng: 151.7579, index_score: 40.73 },
  { rank:  35, sa4_code: 116, region: "Sydney - Blacktown", state: "NSW", lat: -33.73836, lng: 150.86613, index_score: 40.56 },
  { rank:  36, sa4_code: 212, region: "Melbourne - South East", state: "VIC", lat: -38.06988, lng: 145.50893, index_score: 39.85 },
  { rank:  37, sa4_code: 217, region: "Warrnambool and South West", state: "VIC", lat: -37.7061, lng: 141.86262, index_score: 39.62 },
  { rank:  38, sa4_code: 106, region: "Hunter Valley exc Newcastle", state: "NSW", lat: -32.38616, lng: 150.96479, index_score: 39.14 },
  { rank:  39, sa4_code: 209, region: "Melbourne - North East", state: "VIC", lat: -37.54754, lng: 145.16343, index_score: 38.79 },
  { rank:  40, sa4_code: 205, region: "Latrobe - Gippsland", state: "VIC", lat: -37.77244, lng: 147.01191, index_score: 38.5 },
  { rank:  41, sa4_code: 127, region: "Sydney - South West", state: "NSW", lat: -33.89009, lng: 150.83659, index_score: 38.27 },
  { rank:  42, sa4_code: 602, region: "Launceston and North East", state: "TAS", lat: -41.42661, lng: 147.66921, index_score: 38.05 },
  { rank:  43, sa4_code: 310, region: "Ipswich", state: "QLD", lat: -27.61492, lng: 152.59261, index_score: 38.04 },
  { rank:  44, sa4_code: 103, region: "Central West", state: "NSW", lat: -33.36611, lng: 148.12813, index_score: 37.69 },
  { rank:  45, sa4_code: 101, region: "Capital Region", state: "NSW", lat: -36.54054, lng: 149.33682, index_score: 37.12 },
  { rank:  46, sa4_code: 206, region: "Melbourne - Inner", state: "VIC", lat: -37.79329, lng: 144.95872, index_score: 37.03 },
  { rank:  47, sa4_code: 401, region: "Adelaide - Central and Hills", state: "SA", lat: -34.9995, lng: 138.84195, index_score: 36.93 },
  { rank:  48, sa4_code: 801, region: "Australian Capital Territory", state: "ACT", lat: -35.45265, lng: 148.97176, index_score: 36.77 },
  { rank:  49, sa4_code: 603, region: "South East", state: "TAS", lat: -42.32883, lng: 146.69879, index_score: 36.57 },
  { rank:  50, sa4_code: 208, region: "Melbourne - Inner South", state: "VIC", lat: -37.91283, lng: 145.03637, index_score: 35.95 },
  { rank:  51, sa4_code: 204, region: "Hume", state: "VIC", lat: -36.91367, lng: 146.13452, index_score: 35.66 },
  { rank:  52, sa4_code: 207, region: "Melbourne - Inner East", state: "VIC", lat: -37.80522, lng: 145.11082, index_score: 35.29 },
  { rank:  53, sa4_code: 210, region: "Melbourne - North West", state: "VIC", lat: -37.44157, lng: 144.7422, index_score: 34.51 },
  { rank:  54, sa4_code: 214, region: "Mornington Peninsula", state: "VIC", lat: -38.31739, lng: 145.08571, index_score: 34.14 },
  { rank:  55, sa4_code: 317, region: "Toowoomba", state: "QLD", lat: -27.57663, lng: 152.11456, index_score: 34.14 },
  { rank:  56, sa4_code: 203, region: "Geelong", state: "VIC", lat: -38.07259, lng: 144.13345, index_score: 33.55 },
  { rank:  57, sa4_code: 403, region: "Adelaide - South", state: "SA", lat: -35.14565, lng: 138.57346, index_score: 33.48 },
  { rank:  58, sa4_code: 501, region: "Bunbury", state: "WA", lat: -34.04896, lng: 116.02262, index_score: 32.81 },
  { rank:  59, sa4_code: 110, region: "New England and North West", state: "NSW", lat: -30.03689, lng: 150.54159, index_score: 32.8 },
  { rank:  60, sa4_code: 201, region: "Ballarat", state: "VIC", lat: -37.34482, lng: 143.60533, index_score: 32.42 },
  { rank:  61, sa4_code: 213, region: "Melbourne - West", state: "VIC", lat: -37.79665, lng: 144.63043, index_score: 32.12 },
  { rank:  62, sa4_code: 407, region: "South Australia - South East", state: "SA", lat: -35.19449, lng: 140.00698, index_score: 31.79 },
  { rank:  63, sa4_code: 312, region: "Mackay - Isaac - Whitsunday", state: "QLD", lat: -21.65323, lng: 147.91874, index_score: 30.5 },
  { rank:  64, sa4_code: 318, region: "Townsville", state: "QLD", lat: -20.05091, lng: 146.04658, index_score: 29.91 },
  { rank:  65, sa4_code: 702, region: "Northern Territory - Outback", state: "NT", lat: -19.4927, lng: 133.44266, index_score: 29.52 },
  { rank:  66, sa4_code: 601, region: "Hobart", state: "TAS", lat: -42.91493, lng: 147.24478, index_score: 28.25 },
  { rank:  67, sa4_code: 405, region: "Barossa - Yorke - Mid North", state: "SA", lat: -33.67319, lng: 138.65747, index_score: 27.7 },
  { rank:  68, sa4_code: 113, region: "Riverina", state: "NSW", lat: -34.88271, lng: 147.07341, index_score: 26.74 },
  { rank:  69, sa4_code: 402, region: "Adelaide - North", state: "SA", lat: -34.70056, lng: 138.66191, index_score: 26.56 },
  { rank:  70, sa4_code: 202, region: "Bendigo", state: "VIC", lat: -36.485, lng: 143.96607, index_score: 25.34 },
  { rank:  71, sa4_code: 216, region: "Shepparton", state: "VIC", lat: -36.23742, lng: 145.2501, index_score: 25.31 },
  { rank:  72, sa4_code: 308, region: "Central Queensland", state: "QLD", lat: -24.27233, lng: 149.53988, index_score: 25.3 },
  { rank:  73, sa4_code: 404, region: "Adelaide - West", state: "SA", lat: -34.88515, lng: 138.5322, index_score: 24.84 },
  { rank:  74, sa4_code: 504, region: "Perth - North East", state: "WA", lat: -31.77168, lng: 116.10306, index_score: 24.17 },
  { rank:  75, sa4_code: 506, region: "Perth - South East", state: "WA", lat: -32.19743, lng: 116.0579, index_score: 23.22 },
  { rank:  76, sa4_code: 307, region: "Darling Downs - Maranoa", state: "QLD", lat: -27.27367, lng: 149.40878, index_score: 23.04 },
  { rank:  77, sa4_code: 215, region: "North West", state: "VIC", lat: -35.88196, lng: 142.21139, index_score: 21.65 },
  { rank:  78, sa4_code: 109, region: "Murray", state: "NSW", lat: -34.49697, lng: 144.2758, index_score: 20.75 },
  { rank:  79, sa4_code: 502, region: "Mandurah", state: "WA", lat: -32.62345, lng: 115.87131, index_score: 20.27 },
  { rank:  80, sa4_code: 507, region: "Perth - South West", state: "WA", lat: -32.2377, lng: 115.82217, index_score: 20.17 },
  { rank:  81, sa4_code: 510, region: "Western Australia - Outback (North)", state: "WA", lat: -20.17845, lng: 125.65599, index_score: 19.92 },
  { rank:  82, sa4_code: 406, region: "South Australia - Outback", state: "SA", lat: -29.57847, lng: 135.97937, index_score: 19.9 },
  { rank:  83, sa4_code: 503, region: "Perth - Inner", state: "WA", lat: -31.96103, lng: 115.79659, index_score: 17.84 },
  { rank:  84, sa4_code: 315, region: "Queensland - Outback", state: "QLD", lat: -22.28306, lng: 141.62599, index_score: 16.82 },
  { rank:  85, sa4_code: 505, region: "Perth - North West", state: "WA", lat: -31.66471, lng: 115.78169, index_score: 16.8 },
  { rank:  86, sa4_code: 509, region: "Western Australia - Wheat Belt", state: "WA", lat: -31.95488, lng: 118.19528, index_score: 16.19 },
  { rank:  87, sa4_code: 105, region: "Far West and Orana", state: "NSW", lat: -30.88078, lng: 145.3976, index_score: 16.02 },
  { rank:  88, sa4_code: 511, region: "Western Australia - Outback (South)", state: "WA", lat: -27.75878, lng: 123.57616, index_score: 9.15 },
];

export function findNearestMouldRegion(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;

  let nearest = null;
  let minDist = Infinity;

  for (const region of MOULD_INDEX_REGIONS) {
    const dLat = region.lat - numLat;
    const dLng = region.lng - numLng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = region;
    }
  }

  return nearest;
}

const LOCATION_RISK_BANDS = [
  { id: "severe", label: "Severe", min: 50 },
  { id: "elevated", label: "Elevated", min: 36 },
  { id: "moderate", label: "Moderate", min: 22 },
  { id: "low", label: "Low", min: 0 },
];

export function locationRiskLevel(indexScore) {
  if (typeof indexScore !== "number" || !Number.isFinite(indexScore)) return null;
  return LOCATION_RISK_BANDS.find((band) => indexScore >= band.min) || LOCATION_RISK_BANDS[LOCATION_RISK_BANDS.length - 1];
}
