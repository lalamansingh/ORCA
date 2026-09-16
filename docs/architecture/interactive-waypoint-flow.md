# Interactive Waypoint Generation Architecture

## User Interaction Lifecycle
1. User enters Route Planner mode (`activeTab === 'route'`).
2. Tapping on MapLibre canvas emits coordinate event `(lat, lon)`.
3. First tap registers Departure Harbor (Point A) and arms Point B listener.
4. Second tap registers Destination (Point B) and computes fairway corridor.
5. Geometry GeoJSON is dispatched to MapLibre source for hardware-accelerated rendering.
