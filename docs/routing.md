# Safe marine route planning

ORCA Route Engine v1 is a deterministic, bounded 8-neighbour A* implementation.
Distance uses haversine kilometres; hard land/prohibited cells are excluded and
cannot be overridden by client prompts or cost weights. Soft risk, alert,
boundary, and current penalties influence `LOWEST_RISK` and `BALANCED` routes.

The production API fails closed with `UNAVAILABLE` until an authoritative land
mask and routing environmental data are connected. With `ORCA_DEMO_MODE=true`,
the API returns an explicitly `DEMO` prototype grid route. A direct geodesic is
reported only as reference distance and is never substituted after search
failure.

`POST /api/v1/routes/calculate` requires authentication and structured start and
destination coordinates. Inputs cannot provide executable cost functions,
provider URLs, or constraint overrides. Results include GeoJSON coordinates in
longitude/latitude order, segments, direct distance, detour ratio, evidence,
model version, data quality, and limitations.

This is a decision-support marine route, not certified navigation or official
shipping clearance. Grid resolution and departure-time sampling affect accuracy;
future work must connect verified land, geofence, forecast, current, and alert
corridor masks before live route guidance is enabled.
