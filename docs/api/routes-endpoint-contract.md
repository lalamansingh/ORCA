# API Contract: POST /api/v1/routes/calculate

## Request Payload
```json
{
  "start": { "latitude": 18.92, "longitude": 72.83 },
  "destination": { "latitude": 19.10, "longitude": 72.60 },
  "route_mode": "LOWEST_RISK"
}
```

## Response Attributes
- `direct_distance_km`: Euclidean/Haversine direct distance
- `distance_km`: Optimized fairway path distance
- `geometry`: GeoJSON LineString
- `risk_summary`: Environmental and safety assessment
