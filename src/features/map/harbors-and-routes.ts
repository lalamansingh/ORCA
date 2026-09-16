import { degreesToCompass } from "@/features/conditions/format";

export interface CoastalHarbor {
  name: string;
  state: string;
  lat: number;
  lon: number;
  sea: string;
}

export const COASTAL_HARBORS: CoastalHarbor[] = [
  { name: "Veraval Fishing Port", state: "Gujarat", lat: 20.90, lon: 70.36, sea: "Arabian Sea" },
  { name: "Porbandar Harbor", state: "Gujarat", lat: 21.64, lon: 69.60, sea: "Arabian Sea" },
  { name: "Mumbai Sassoon Docks", state: "Maharashtra", lat: 18.92, lon: 72.83, sea: "Arabian Sea" },
  { name: "Ratnagiri Mirkarwada", state: "Maharashtra", lat: 16.99, lon: 73.30, sea: "Arabian Sea" },
  { name: "Goa (Panaji & Mormugao)", state: "Goa", lat: 15.40, lon: 73.80, sea: "Arabian Sea" },
  { name: "Mangalore Old Port", state: "Karnataka", lat: 12.87, lon: 74.84, sea: "Arabian Sea" },
  { name: "Kochi Port & Harbor", state: "Kerala", lat: 9.93, lon: 76.26, sea: "Arabian Sea" },
  { name: "Kanyakumari Coast", state: "Tamil Nadu", lat: 8.08, lon: 77.55, sea: "Indian Ocean" },
  { name: "Tuticorin Fishing Harbor", state: "Tamil Nadu", lat: 8.76, lon: 78.13, sea: "Gulf of Mannar" },
  { name: "Chennai Kasimedu Harbor", state: "Tamil Nadu", lat: 13.08, lon: 80.27, sea: "Bay of Bengal" },
  { name: "Visakhapatnam Harbor", state: "Andhra Pradesh", lat: 17.68, lon: 83.21, sea: "Bay of Bengal" },
  { name: "Paradip Port", state: "Odisha", lat: 20.26, lon: 86.66, sea: "Bay of Bengal" },
  { name: "Digha & Shankarpur", state: "West Bengal", lat: 21.62, lon: 87.51, sea: "Bay of Bengal" },
];

export interface CatalogPFZItem {
  name: string;
  dist: string;
  dir: string;
  depth: string;
  yield: string;
  fish: string;
  target_species?: string;
  distance_km?: number;
  bearing_degrees?: number;
  sst?: string;
}

export const PORT_PFZ_CATALOG: Record<string, CatalogPFZItem[]> = {
  Veraval: [
    { name: "Veraval Coastal Upwelling #1", dist: "14.2 km", dir: "SW · 220°", depth: "22 m", yield: "94%", fish: "Ribbonfish, Croaker, Pomfret", sst: "27.8°C" },
    { name: "Saurashtra Thermal Front #2", dist: "21.0 km", dir: "W · 265°", depth: "34 m", yield: "88%", fish: "Tuna, Seer fish, Squid", sst: "27.2°C" },
    { name: "Diu Head Shelf Ridge #3", dist: "18.5 km", dir: "SE · 145°", depth: "26 m", yield: "81%", fish: "Prawn, Threadfin Bream, Catfish", sst: "28.0°C" },
  ],
  Porbandar: [
    { name: "Porbandar High Chlorophyll Patch #1", dist: "18.0 km", dir: "SW · 225°", depth: "28 m", yield: "90%", fish: "Hilsa, Pomfret, Ribbonfish", sst: "27.5°C" },
    { name: "Okha Shelf Deep Trench #2", dist: "27.5 km", dir: "NW · 305°", depth: "40 m", yield: "85%", fish: "Yellowfin Tuna, Kingfish", sst: "26.9°C" },
    { name: "Navibandar Coastal Front #3", dist: "12.0 km", dir: "S · 180°", depth: "18 m", yield: "76%", fish: "Mackerel, Sardine, Prawn", sst: "28.1°C" },
  ],
  Chennai: [
    { name: "Kasimedu Offshore Front #1", dist: "14.5 km", dir: "E · 95°", depth: "25 m", yield: "92%", fish: "Mackerel, Sardine, Tuna, Anchovy", sst: "28.4°C" },
    { name: "Ennore Pelagic Thermal Front #2", dist: "21.8 km", dir: "NE · 45°", depth: "35 m", yield: "86%", fish: "Seer fish, King Mackerel, Barracuda", sst: "28.0°C" },
    { name: "Mahabalipuram Shelf Zone #3", dist: "19.2 km", dir: "SE · 135°", depth: "20 m", yield: "79%", fish: "Squid, Prawn, Ribbonfish", sst: "28.6°C" },
  ],
  Kochi: [
    { name: "Kochi Offshore Upwelling #1", dist: "16.8 km", dir: "W · 270°", depth: "28 m", yield: "91%", fish: "Oil Sardine, Indian Mackerel, Tuna", sst: "28.2°C" },
    { name: "Malabar Shelf Trench #2", dist: "24.5 km", dir: "NW · 315°", depth: "38 m", yield: "84%", fish: "Skipjack Tuna, Threadfin Bream", sst: "27.6°C" },
    { name: "Vypin Coastal Front #3", dist: "11.2 km", dir: "SW · 230°", depth: "18 m", yield: "78%", fish: "Squid, Prawn, Ribbonfish", sst: "28.7°C" },
  ],
  Mumbai: [
    { name: "Mumbai High Edge Zone #1", dist: "22.5 km", dir: "W · 260°", depth: "30 m", yield: "87%", fish: "Pomfret, Bombay Duck, Hilsa", sst: "27.9°C" },
    { name: "Alibag Thermal Front #2", dist: "17.0 km", dir: "SW · 215°", depth: "22 m", yield: "80%", fish: "Mackerel, Seer fish, Prawn", sst: "28.3°C" },
    { name: "Sassoon Offshore Bank #3", dist: "29.8 km", dir: "NW · 300°", depth: "42 m", yield: "73%", fish: "Yellowfin Tuna, Ribbonfish", sst: "27.1°C" },
  ],
  Visakhapatnam: [
    { name: "Vizag Outer Continental Shelf #1", dist: "19.5 km", dir: "SE · 140°", depth: "32 m", yield: "89%", fish: "Yellowfin Tuna, Seer fish, Sailfish", sst: "28.1°C" },
    { name: "Bheemunipatnam Thermal Front #2", dist: "25.0 km", dir: "E · 90°", depth: "36 m", yield: "82%", fish: "Ribbonfish, Mackerel, Pomfret", sst: "27.8°C" },
    { name: "Gangavaram Deep Trench #3", dist: "15.8 km", dir: "S · 175°", depth: "24 m", yield: "77%", fish: "Squid, Anchovy, Sardine", sst: "28.5°C" },
  ],
  Tuticorin: [
    { name: "Gulf of Mannar Deep Ridge #1", dist: "15.0 km", dir: "SE · 135°", depth: "22 m", yield: "92%", fish: "Tuna, Seer fish, Barracuda", sst: "28.5°C" },
    { name: "Kallaru Offshore Front #2", dist: "22.4 km", dir: "E · 90°", depth: "30 m", yield: "85%", fish: "Trevally, Snapper, Emperor", sst: "28.0°C" },
    { name: "Tiruchendur Shelf Zone #3", dist: "12.5 km", dir: "S · 170°", depth: "18 m", yield: "78%", fish: "Squid, Sardine, Crab", sst: "28.8°C" },
  ],
  default: [
    { name: "Primary Coastal PFZ Zone #1", dist: "17.5 km", dir: "SW · 225°", depth: "25 m", yield: "86%", fish: "Tuna, Mackerel, Sardine", sst: "28.2°C" },
    { name: "Offshore Thermal Front #2", dist: "26.0 km", dir: "W · 270°", depth: "36 m", yield: "80%", fish: "Kingfish, Barracuda, Pomfret", sst: "27.5°C" },
    { name: "Continental Shelf Zone #3", dist: "13.2 km", dir: "S · 185°", depth: "20 m", yield: "74%", fish: "Squid, Ribbonfish, Anchovies", sst: "28.7°C" },
  ],
};

export interface ComputedMarineRoute {
  distanceKm: number;
  distanceNmi: number;
  bearingDeg: number;
  bearingCompass: string;
  durationMinutes: number;
  fuelLitres: number;
  geometry: import("geojson").LineString;
  waypoints: Array<{ name: string; lat: number; lon: number; distKm: number }>;
}

export function computeMarineRouteBetweenPoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): ComputedMarineRoute {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((endLat - startLat) * Math.PI) / 180;
  const dLon = ((endLon - startLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistKm = Math.max(0.1, R * c);
  // Nautical navigation fairway distance with safe clearance detour factor
  const distanceKm = directDistKm * 1.06;
  const distanceNmi = distanceKm * 0.539957;

  // Bearing calculation
  const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);
  const x =
    Math.cos((startLat * Math.PI) / 180) * Math.sin((endLat * Math.PI) / 180) -
    Math.sin((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.cos(dLon);
  const rawBearing = (Math.atan2(y, x) * 180) / Math.PI;
  const bearingDeg = Math.round((rawBearing + 360) % 360);
  const bearingCompass = degreesToCompass(bearingDeg);

  // Cruising speed ~12 knots = ~22.2 km/h
  const durationMinutes = Math.max(5, Math.round((distanceKm / 22.2) * 60));
  const fuelLitres = parseFloat((distanceKm * 0.55).toFixed(1));

  // Nautical fairway curve calculation
  const deltaLat = endLat - startLat;
  const deltaLon = endLon - startLon;
  const distDegrees = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);
  const perpLat = -deltaLon / (distDegrees + 1e-9);
  const perpLon = deltaLat / (distDegrees + 1e-9);
  const curveAmp = distDegrees * 0.12;

  const numCoords = 32;
  const coords: [number, number][] = [];
  for (let i = 0; i < numCoords; i++) {
    const t = i / (numCoords - 1);
    const baseLat = startLat + deltaLat * t;
    const baseLon = startLon + deltaLon * t;
    const lateralOffset = curveAmp * Math.sin(t * Math.PI) * (1.0 - 0.22 * Math.sin(t * Math.PI * 3));
    const ptLat = baseLat + perpLat * lateralOffset;
    const ptLon = baseLon + perpLon * lateralOffset;
    coords.push([parseFloat(ptLon.toFixed(5)), parseFloat(ptLat.toFixed(5))]);
  }

  const waypoints: Array<{ name: string; lat: number; lon: number; distKm: number }> = [
    {
      name: "Point A (Departure Harbor)",
      lat: coords[0][1],
      lon: coords[0][0],
      distKm: 0,
    },
    {
      name: "Coastal Channel Exit Fairway",
      lat: coords[Math.floor(numCoords * 0.22)][1],
      lon: coords[Math.floor(numCoords * 0.22)][0],
      distKm: parseFloat((distanceKm * 0.22).toFixed(1)),
    },
    {
      name: "Mid-Sea Deep Fairway Corridor",
      lat: coords[Math.floor(numCoords * 0.5)][1],
      lon: coords[Math.floor(numCoords * 0.5)][0],
      distKm: parseFloat((distanceKm * 0.5).toFixed(1)),
    },
    {
      name: "Target Approach Fairway Corridor",
      lat: coords[Math.floor(numCoords * 0.78)][1],
      lon: coords[Math.floor(numCoords * 0.78)][0],
      distKm: parseFloat((distanceKm * 0.78).toFixed(1)),
    },
    {
      name: "Point B (Destination)",
      lat: coords[coords.length - 1][1],
      lon: coords[coords.length - 1][0],
      distKm: parseFloat(distanceKm.toFixed(1)),
    },
  ];

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    distanceNmi: parseFloat(distanceNmi.toFixed(2)),
    bearingDeg,
    bearingCompass,
    durationMinutes,
    fuelLitres,
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
    waypoints,
  };
}

export function calculateDestinationCoordinate(
  originLat: number,
  originLon: number,
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const R = 6371; // Earth's mean radius in km
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (originLat * Math.PI) / 180;
  const lon1 = (originLon * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [parseFloat(((lon2 * 180) / Math.PI).toFixed(5)), parseFloat(((lat2 * 180) / Math.PI).toFixed(5))];
}

export function extractDistanceAndBearing(
  item?: { dist?: string; dir?: string; distance_km?: number | null; bearing_degrees?: number | null },
  fallbackLon = 72.83
): { distanceKm: number; bearingDeg: number } {
  let distanceKm = 17.5;
  if (item?.distance_km != null && !isNaN(item.distance_km)) {
    distanceKm = item.distance_km;
  } else if (item?.dist) {
    const dMatch = item.dist.match(/(\d+(?:\.\d+)?)/);
    if (dMatch) distanceKm = parseFloat(dMatch[1]);
  }

  let bearingDeg = fallbackLon < 80 ? 225 : 120; // SW for Arabian Sea, SE for Bay of Bengal
  if (item?.bearing_degrees != null && !isNaN(item.bearing_degrees)) {
    bearingDeg = item.bearing_degrees;
  } else if (item?.dir) {
    const degMatch = item.dir.match(/(\d+(?:\.\d+)?)\s*°/);
    if (degMatch) {
      bearingDeg = parseFloat(degMatch[1]);
    } else {
      const CARDINALS: Record<string, number> = {
        N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
        E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
        S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
        W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
      };
      const cMatch = item.dir.match(/\b([A-Z]{1,3})\b/i);
      if (cMatch && CARDINALS[cMatch[1].toUpperCase()] !== undefined) {
        bearingDeg = CARDINALS[cMatch[1].toUpperCase()];
      }
    }
  }

  return { distanceKm, bearingDeg };
}
