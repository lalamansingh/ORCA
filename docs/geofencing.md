# Maritime geofencing

ORCA performs deterministic PostGIS containment and geography-distance checks
against provenance-bearing `MarineZone` records. It never generates boundaries,
and no-data returns `UNAVAILABLE`, not `CLEAR`. Marine risk and geofence status
remain independent.

## Source review (8 September 2026)

- India Code publishes the Territorial Waters, Continental Shelf, Exclusive
  Economic Zone and Other Maritime Zones Act, 1976. It is an authoritative legal
  reference, but the reviewed page is not a downloadable operational boundary
  geometry: https://www.indiacode.nic.in/indiacode/handle/123456789/1484
- NCPOR documents India's EEZ survey and marine geophysical database. The public
  material reviewed did not establish an openly licensed legal boundary vector
  feed: https://www.ncaor.gov.in/pages/view/190/249-survey-of-the-eez
- INCOIS PFZ Geoportal visibly includes an EEZ display layer, but its presence as
  a visual layer is not treated as proof of legal authority or reuse terms:
  https://incois.gov.in/geoportal/MFASPFZ/index.html
- MoEFCC/Wildlife Institute of India publish protected-area inventories and MPA
  names/areas. The reviewed inventory is authoritative descriptive evidence, not
  sufficient geometry plus activity rules for automatic prohibition:
  https://eiacp.moef.gov.in/file/PA%20Database_NP1768194801983189.pdf

Consequently, real boundary, restriction, and protected-area geometry providers
remain `NOT_CONNECTED` until geometry, CRS, version, access/license terms, and
activity-specific rules are verified. Demo geometry must be explicitly `DEMO`.

## Semantics

Canonical outcomes are `CLEAR`, `CAUTION`, `RESTRICTED`, `PROHIBITED`, `UNKNOWN`,
`UNAVAILABLE`, and `DEMO`. Protected areas default to caution/unknown unless an
activity rule is source-backed. The configurable proximity threshold is ORCA
operational caution logic, not law. All responses carry the concise legal-data
limitation and source evidence.
