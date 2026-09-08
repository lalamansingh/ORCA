export const INDIA_MARINE_VIEW = { center: [78.9, 15.7] as [number, number], zoom: 4.4 };
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const LOCATION_ZOOM = 11;

export const SATELLITE_STYLE: import("maplibre-gl").StyleSpecification = {
  version: 8,
  sources: {
    "satellite-tiles": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS",
    },
  },
  layers: [
    {
      id: "satellite-base-layer",
      type: "raster",
      source: "satellite-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const OCEAN_STYLE: import("maplibre-gl").StyleSpecification = {
  version: 8,
  sources: {
    "ocean-tiles": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, GEBCO, NOAA, National Geographic",
    },
  },
  layers: [
    {
      id: "ocean-base-layer",
      type: "raster",
      source: "ocean-tiles",
      minzoom: 0,
      maxzoom: 18,
    },
  ],
};

export const DARK_OCEAN_STYLE: import("maplibre-gl").StyleSpecification = {
  version: 8,
  sources: {
    "dark-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "dark-base-layer",
      type: "raster",
      source: "dark-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const VECTOR_STYLE: import("maplibre-gl").StyleSpecification = {
  version: 8,
  sources: {
    "vector-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "voyager-base-layer",
      type: "raster",
      source: "vector-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
