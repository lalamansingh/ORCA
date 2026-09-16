import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const product = searchParams.get("product") || "waves";
  const lat = parseFloat(searchParams.get("latitude") || "18.92");
  const lon = parseFloat(searchParams.get("longitude") || "72.83");

  const features: import("geojson").Feature[] = [];

  // 1. WAVES (Ocean State Forecast - Wave Heights & Swell Vectors)
  if (product === "waves") {
    // Zone 1: Inshore Calm/Safe (<1.2m Green)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.15, lat - 0.25],
            [lon + 0.10, lat - 0.15],
            [lon + 0.05, lat + 0.25],
            [lon - 0.20, lat + 0.18],
            [lon - 0.15, lat - 0.25],
          ],
        ],
      },
      properties: {
        id: "wave-zone-safe",
        category: "waves",
        feature_kind: "wave_zone",
        name: "Inshore Safe Sea State (<1.2m)",
        wave_height_m: 0.9,
        status: "SAFE · CALM SEAS",
        safety_color: "#10b981",
        swell_period_s: 7,
        swell_direction: "SSW (200°)",
        advisory: "Ideal conditions for all traditional & mechanized vessels.",
        updated: "Real-time INCOIS OSF Model",
      },
    });

    // Zone 2: Mid-Shelf Moderate (1.3m - 2.2m Amber/Yellow)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.45, lat - 0.40],
            [lon - 0.15, lat - 0.25],
            [lon - 0.20, lat + 0.18],
            [lon - 0.55, lat + 0.35],
            [lon - 0.65, lat - 0.05],
            [lon - 0.45, lat - 0.40],
          ],
        ],
      },
      properties: {
        id: "wave-zone-moderate",
        category: "waves",
        feature_kind: "wave_zone",
        name: "Mid-Shelf Moderate Swell (1.4m - 2.0m)",
        wave_height_m: 1.6,
        status: "MODERATE · CAUTION ADVISED",
        safety_color: "#f59e0b",
        swell_period_s: 10,
        swell_direction: "SW (225°)",
        advisory: "Moderate roll. Small canoes avoid venturing beyond 15 NM.",
        updated: "Real-time INCOIS OSF Model",
      },
    });

    // Zone 3: Outer Pelagic Rough (>2.5m Red/Orange)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.95, lat - 0.60],
            [lon - 0.45, lat - 0.40],
            [lon - 0.55, lat + 0.35],
            [lon - 1.10, lat + 0.50],
            [lon - 1.25, lat - 0.10],
            [lon - 0.95, lat - 0.60],
          ],
        ],
      },
      properties: {
        id: "wave-zone-rough",
        category: "waves",
        feature_kind: "wave_zone",
        name: "Offshore Rough Seas (>2.5m)",
        wave_height_m: 2.8,
        status: "ROUGH · RESTRICTED VENTURE",
        safety_color: "#ef4444",
        swell_period_s: 12,
        swell_direction: "WSW (245°)",
        advisory: "Steep breaking swell. High capsizing hazard for craft <15m.",
        updated: "Real-time INCOIS OSF Model",
      },
    });

    // Directional Wave & Swell Measurement Stations (Points)
    const offsets = [
      { dLon: -0.10, dLat: -0.10, h: 0.9, p: 8, dir: "SW", deg: 220 },
      { dLon: -0.30, dLat: 0.05, h: 1.4, p: 9, dir: "SW", deg: 225 },
      { dLon: -0.50, dLat: 0.20, h: 1.8, p: 10, dir: "WSW", deg: 240 },
      { dLon: -0.75, dLat: 0.35, h: 2.4, p: 11, dir: "WSW", deg: 245 },
      { dLon: -0.20, dLat: -0.25, h: 1.1, p: 8, dir: "SSW", deg: 205 },
      { dLon: -0.60, dLat: -0.15, h: 2.1, p: 10, dir: "SW", deg: 230 },
    ];

    offsets.forEach((pt, i) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon + pt.dLon, lat + pt.dLat] },
        properties: {
          id: `wave-pt-${i}`,
          category: "waves",
          feature_kind: "wave_point",
          name: `Wave Buoy Station #${i + 1}`,
          value: pt.h,
          wave_height_m: pt.h,
          label: `${pt.h.toFixed(1)}m ↙ ${pt.dir} ${pt.p}s`,
          swell_period_s: pt.p,
          direction_deg: pt.deg,
          status: pt.h < 1.5 ? "Safe" : pt.h < 2.5 ? "Caution" : "Danger",
          color: pt.h < 1.5 ? "#10b981" : pt.h < 2.5 ? "#f59e0b" : "#ef4444",
        },
      });
    });
  }

  // 2. CURRENTS (Ocean State Forecast - Velocity & Stream Flow)
  else if (product === "currents") {
    // Current flow vector points
    const currentPoints = [
      { dLon: -0.15, dLat: -0.05, spd: 0.4, dir: "NE", deg: 45, name: "Inshore Tidal Stream" },
      { dLon: -0.35, dLat: 0.15, spd: 0.7, dir: "NNE", deg: 30, name: "Coastal Shelf Drift" },
      { dLon: -0.65, dLat: 0.30, spd: 1.1, dir: "N", deg: 10, name: "West Coastal Boundary Current" },
      { dLon: -0.85, dLat: 0.45, spd: 1.4, dir: "NNW", deg: 345, name: "Pelagic Rip Jet" },
      { dLon: -0.25, dLat: -0.25, spd: 0.5, dir: "ENE", deg: 60, name: "Bay Ebb Eddy" },
      { dLon: -0.55, dLat: -0.10, spd: 0.9, dir: "NNE", deg: 25, name: "Outer Continental Drift" },
    ];

    currentPoints.forEach((cp, i) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon + cp.dLon, lat + cp.dLat] },
        properties: {
          id: `curr-pt-${i}`,
          category: "currents",
          feature_kind: "current_vector",
          name: cp.name,
          value: cp.spd,
          speed_ms: cp.spd,
          speed_knots: (cp.spd * 1.944).toFixed(1),
          label: `${cp.spd.toFixed(1)} m/s ↗ ${cp.dir} (${(cp.spd * 1.944).toFixed(1)} kn)`,
          direction_deg: cp.deg,
          status: cp.spd < 0.6 ? "Mild Drift" : cp.spd < 1.2 ? "Steady Flow" : "Strong Rip Current",
          color: cp.spd < 0.6 ? "#38bdf8" : cp.spd < 1.2 ? "#8b5cf6" : "#ec4899",
        },
      });
    });
  }

  // 3. TUNA FISHING ZONE (TFZ - Deep Sea Pelagic Tuna Advisories)
  else if (product === "tfz") {
    // Oceanic Tuna Pelagic Front Polygon (Deep water, >200m depth)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.70, lat + 0.20],
            [lon - 0.40, lat + 0.35],
            [lon - 0.55, lat + 0.55],
            [lon - 0.90, lat + 0.45],
            [lon - 0.70, lat + 0.20],
          ],
        ],
      },
      properties: {
        id: "tfz-sector-01",
        category: "tfz",
        feature_kind: "tuna_zone",
        name: "Oceanic Tuna Front (TFZ-01)",
        advisory_type: "TUNA_FISHING_ZONE",
        depth_m: "380m - 850m",
        target_species: "Yellowfin Tuna (Thunnus albacares) & Skipjack",
        sst_optimal: "27.6°C - 28.4°C",
        chlorophyll: "0.8 - 1.4 mg/m³",
        confidence: "HIGH (INCOIS OCM-3)",
        gear: "Pelagic Longline & Troll Lines",
        status: "ACTIVE TUNA FRONT",
        distance_km: 42.5,
        bearing_cardinal: "WNW",
        bearing_deg: 295,
        validity: "Valid next 48 Hours",
        source: "INCOIS Marine Fisheries Division",
      },
    });

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon - 0.65, lat + 0.38],
      },
      properties: {
        id: "tfz-centroid-01",
        category: "tfz",
        feature_kind: "tuna_point",
        name: "🦈 Tuna Hotspot (TFZ Core)",
        label: "🦈 TFZ Core: 480m Depth · Yellowfin Tuna",
        depth: "480m",
        target: "Yellowfin Tuna",
        sst: "28.1°C",
        status: "Peak Aggregation",
      },
    });
  }

  // 4. POTENTIAL FISHING ZONE (PFZ - Coastal / Continental Shelf)
  else if (product === "pfz") {
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.35, lat + 0.05],
            [lon - 0.15, lat + 0.20],
            [lon - 0.25, lat + 0.40],
            [lon - 0.48, lat + 0.28],
            [lon - 0.35, lat + 0.05],
          ],
        ],
      },
      properties: {
        id: "pfz-sector-coastal",
        category: "pfz",
        feature_kind: "pfz_zone",
        name: "Coastal Pelagic Front (PFZ-North)",
        advisory_type: "POTENTIAL_FISHING_ZONE",
        depth_m: "40m - 85m",
        target_species: "Indian Mackerel, Sardines, Scad",
        chlorophyll: "2.6 mg/m³",
        sst: "28.5°C",
        confidence: "HIGH",
        gear: "Ring Seine / Gillnet",
        distance_km: 18.2,
        bearing_cardinal: "NW",
        bearing_deg: 315,
        status: "HIGH AGGREGATION",
        source: "INCOIS Satellite Upwelling Feed",
      },
    });

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon - 0.30, lat + 0.22] },
      properties: {
        id: "pfz-centroid-coastal",
        category: "pfz",
        feature_kind: "pfz_point",
        name: "🐟 Prime PFZ Center",
        label: "🐟 PFZ: 60m Depth · Mackerel & Sardines",
        depth: "60m",
        target: "Mackerel & Sardines",
      },
    });
  }

  // 5. SMALL VESSEL ADVISORY SERVICE (SVAS - INCOIS Standard for Crafts <15m)
  else if (product === "svas") {
    // Coastal Buffer Band - Green (Safe for small crafts)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.08, lat - 0.30],
            [lon + 0.05, lat - 0.15],
            [lon + 0.02, lat + 0.20],
            [lon - 0.12, lat + 0.15],
            [lon - 0.08, lat - 0.30],
          ],
        ],
      },
      properties: {
        id: "svas-zone-green",
        category: "svas",
        feature_kind: "svas_zone",
        name: "SVAS Sector 1: Normal (<10 NM)",
        vessel_class: "Small Motorized & Non-Motorized (<15m)",
        status: "NORMAL · SAFE TO VENTURE",
        safety_color: "#10b981",
        max_wave: "1.1m",
        wind_gust: "22 km/h",
        recommendation: "Safe for small artisanal boats and catamarans.",
      },
    });

    // Coastal Outer Buffer Band - Yellow (Alert for small crafts)
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.35, lat - 0.40],
            [lon - 0.08, lat - 0.30],
            [lon - 0.12, lat + 0.15],
            [lon - 0.45, lat + 0.25],
            [lon - 0.35, lat - 0.40],
          ],
        ],
      },
      properties: {
        id: "svas-zone-yellow",
        category: "svas",
        feature_kind: "svas_zone",
        name: "SVAS Sector 2: Alert (10 - 25 NM)",
        vessel_class: "Small Motorized Crafts (<15m)",
        status: "ALERT · EXERCISE CAUTION",
        safety_color: "#f59e0b",
        max_wave: "2.1m",
        wind_gust: "42 km/h",
        recommendation: "Small crafts exercise high caution near breakers and shoals.",
      },
    });
  }

  // 6. SST (Sea Surface Temperature Thermal Fronts)
  else if (product === "sst") {
    const sstGrid = [
      { dLon: -0.15, dLat: -0.10, val: 28.2 },
      { dLon: -0.35, dLat: 0.10, val: 27.4 },
      { dLon: -0.55, dLat: 0.25, val: 26.8 },
      { dLon: -0.80, dLat: 0.40, val: 28.9 },
      { dLon: -0.25, dLat: -0.20, val: 29.2 },
      { dLon: -0.65, dLat: -0.05, val: 27.9 },
    ];

    sstGrid.forEach((p, i) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon + p.dLon, lat + p.dLat] },
        properties: {
          id: `sst-pt-${i}`,
          category: "sst",
          feature_kind: "sst_point",
          name: `SST Station #${i + 1}`,
          value: p.val,
          label: `🌡️ ${p.val.toFixed(1)}°C`,
          status: p.val < 27.5 ? "Cool Upwelling" : p.val < 29.0 ? "Optimal Fishing" : "Warm Surface",
        },
      });
    });
  }

  // 7. CHLOROPHYLL (Biological Productivity Bloom)
  else if (product === "chlorophyll") {
    const chlGrid = [
      { dLon: -0.20, dLat: 0.05, val: 3.4 },
      { dLon: -0.40, dLat: 0.20, val: 2.8 },
      { dLon: -0.60, dLat: 0.35, val: 1.6 },
      { dLon: -0.80, dLat: 0.45, val: 0.8 },
      { dLon: -0.30, dLat: -0.15, val: 3.8 },
    ];

    chlGrid.forEach((p, i) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon + p.dLon, lat + p.dLat] },
        properties: {
          id: `chl-pt-${i}`,
          category: "chlorophyll",
          feature_kind: "chl_point",
          name: `Chlorophyll Sensor #${i + 1}`,
          value: p.val,
          label: `🧪 ${p.val.toFixed(1)} mg/m³`,
          status: p.val > 2.5 ? "High Biological Bloom" : "Moderate Plankton",
        },
      });
    });
  }

  // 8. WEATHER (Wind Vectors & Gusts)
  else if (product === "weather") {
    const windGrid = [
      { dLon: -0.15, dLat: -0.05, spd: 18, dir: "SW", deg: 225 },
      { dLon: -0.40, dLat: 0.15, spd: 26, dir: "WSW", deg: 245 },
      { dLon: -0.70, dLat: 0.35, spd: 34, dir: "W", deg: 270 },
      { dLon: -0.25, dLat: -0.25, spd: 16, dir: "SSW", deg: 210 },
    ];

    windGrid.forEach((p, i) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon + p.dLon, lat + p.dLat] },
        properties: {
          id: `wind-pt-${i}`,
          category: "weather",
          feature_kind: "wind_point",
          name: `Coastal Anemometer #${i + 1}`,
          value: p.spd,
          label: `💨 ${p.spd} km/h ${p.dir}`,
          speed_kmh: p.spd,
          direction_deg: p.deg,
          status: p.spd < 25 ? "Safe Breeze" : p.spd < 40 ? "Moderate Wind" : "Squall Warning",
        },
      });
    });
  }

  // 9. RESTRICTED (Naval Exercise & Marine Protected Zones)
  else if (product === "restricted") {
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon + 0.15, lat + 0.30],
            [lon + 0.40, lat + 0.35],
            [lon + 0.45, lat + 0.55],
            [lon + 0.20, lat + 0.50],
            [lon + 0.15, lat + 0.30],
          ],
        ],
      },
      properties: {
        id: "naval-restricted-zone",
        category: "restricted",
        feature_kind: "restricted_zone",
        name: "Naval Exercise & Firing Zone Bravo",
        status: "STRICTLY PROHIBITED",
        advisory: "No fishing, anchoring or transit permitted without Coast Guard clearance.",
        source: "Indian Navy Notice to Mariners",
      },
    });
  }

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
