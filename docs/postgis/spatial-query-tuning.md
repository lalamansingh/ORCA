# PostGIS Spatial Indexing & Query Tuning

## Index Guidelines
- Use Generalized Search Tree (`GIST`) indexing on all geometry columns:
```sql
CREATE INDEX idx_zones_geom ON geofence_zones USING GIST (geometry);
```
- Prefer `ST_DWithin` with geography casts over `ST_Distance` in WHERE clauses for indexed bounding searches.
