export const INDIA_MARINE_VIEW = { center: [78.9, 15.7] as [number, number], zoom: 4.4 };
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const LOCATION_ZOOM = 11;

export const COMPOSITE_BASE_STYLE: import("maplibre-gl").StyleSpecification = {
  version: 8,
  sources: {
    "satellite-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS",
    },
    "ocean-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, GEBCO, NOAA, National Geographic",
    },
    "ocean-ref-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, GEBCO, NOAA",
    },
    "dark-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, DeLorme, NAVTEQ",
    },
    "dark-ref-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, DeLorme, NAVTEQ",
    },
    "vector-tiles": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, HERE, Garmin, USGS, NGA",
    },
  },
  layers: [
    {
      id: "satellite-base-layer",
      type: "raster",
      source: "satellite-tiles",
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: "visible" },
    },
    {
      id: "ocean-base-layer",
      type: "raster",
      source: "ocean-tiles",
      minzoom: 0,
      maxzoom: 18,
      layout: { visibility: "none" },
    },
    {
      id: "ocean-ref-layer",
      type: "raster",
      source: "ocean-ref-tiles",
      minzoom: 0,
      maxzoom: 18,
      layout: { visibility: "none" },
    },
    {
      id: "dark-base-layer",
      type: "raster",
      source: "dark-tiles",
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: "none" },
    },
    {
      id: "dark-ref-layer",
      type: "raster",
      source: "dark-ref-tiles",
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: "none" },
    },
    {
      id: "voyager-base-layer",
      type: "raster",
      source: "vector-tiles",
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: "none" },
    },
  ],
};

export const SATELLITE_STYLE = COMPOSITE_BASE_STYLE;
export const OCEAN_STYLE = COMPOSITE_BASE_STYLE;
export const DARK_OCEAN_STYLE = COMPOSITE_BASE_STYLE;
export const VECTOR_STYLE = COMPOSITE_BASE_STYLE;


