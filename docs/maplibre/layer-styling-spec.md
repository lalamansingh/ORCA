# MapLibre Marine Layer Specification

## Vector Layer Stacking Order
1. **Basemap**: OpenFreeMap / Satellite tiles
2. **Bathymetry**: Contoured ocean depth layers
3. **PFZ Zones**: INCOIS chlor-front polygons (`#16a085`)
4. **Active Advisories**: IMD polygon fills (`#dc2626`)
5. **Fairway Route Line**: Illuminated cyan corridor (`#00f5ff`) with 8px blur glow
6. **Waypoints & Harbors**: High-visibility circular pins
