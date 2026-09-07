"""Official INCOIS PFZ WebGIS WFS integration.

The WFS is the public GeoJSON endpoint used by the INCOIS PFZ WebGIS.  It supplies
advisory day and geometries, but no expiry; validity is therefore kept null and
freshness is derived only from the published advisory day plus configured age.
"""

from datetime import UTC, datetime, timedelta

import httpx

from app.domain.pfz import PFZProviderAvailability, PFZStatus
from app.providers.errors import ProviderError
from app.providers.pfz.base import PFZProvider, PFZProviderResult
from app.schemas.pfz import NormalizedPotentialFishingZone, PFZEvidence

INCOIS_PFZ_WEBGIS_URL = "https://incois.gov.in/geoportal/MFASPFZ/index.html"


class IncoisPFZProvider(PFZProvider):
    name = "INCOIS PFZ WebGIS"

    def __init__(self, client: httpx.AsyncClient, wfs_url: str, timeout: float, max_advisory_age_hours: int, max_features: int) -> None:
        self.client, self.wfs_url, self.timeout = client, wfs_url, timeout
        self.max_age, self.max_features = timedelta(hours=max_advisory_age_hours), max_features

    async def get_current_advisories(self) -> PFZProviderResult:
        now = datetime.now(UTC)
        try:
            response = await self.client.get(self.wfs_url, timeout=self.timeout)
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ProviderError("INCOIS PFZ WFS could not be retrieved") from exc
        if not isinstance(payload, dict) or payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
            raise ProviderError("INCOIS PFZ WFS returned an unexpected payload")
        items: list[NormalizedPotentialFishingZone] = []
        rejected = 0
        for feature in payload["features"][: self.max_features]:
            try:
                items.append(self._normalize(feature, now, payload.get("timeStamp")))
            except (KeyError, TypeError, ValueError):
                rejected += 1
        status = PFZProviderAvailability.OPERATIONAL if not rejected else PFZProviderAvailability.DEGRADED
        message = None if not rejected else f"{rejected} malformed WFS feature(s) were safely skipped."
        return PFZProviderResult(provider=self.name, status=status, source_url=INCOIS_PFZ_WEBGIS_URL, retrieved_at=now, advisories=items, rejected_count=rejected, message=message)

    def _normalize(self, feature: object, now: datetime, source_timestamp: object) -> NormalizedPotentialFishingZone:
        if not isinstance(feature, dict) or not isinstance(feature.get("properties"), dict) or not isinstance(feature.get("geometry"), dict):
            raise ValueError("feature shape")
        properties, geometry = feature["properties"], feature["geometry"]
        kind = geometry.get("type")
        if kind not in {"Point", "LineString", "Polygon", "MultiPolygon", "MultiLineString"} or not geometry.get("coordinates"):
            raise ValueError("unsupported geometry")
        year, ordinal = int(properties["Year"]), int(properties["Julian_day"])
        advisory_date = datetime(year, 1, 1, tzinfo=UTC).date() + timedelta(days=ordinal - 1)
        advisory_at = datetime.combine(advisory_date, datetime.min.time(), tzinfo=UTC)
        zone_status = PFZStatus.UPCOMING if advisory_at > now else PFZStatus.CURRENT if now - advisory_at <= self.max_age else PFZStatus.STALE
        identifier = str(properties.get("UID") or properties.get("Sno") or feature.get("id") or "").strip()
        if not identifier:
            raise ValueError("missing identifier")
        sector = str(properties.get("SECTORNAME") or "").strip() or None
        sno = str(properties.get("Sno") or identifier).strip()
        metadata = {key: properties[key] for key in ("Year", "Julian_day", "Sno", "UID", "Length") if properties.get(key) is not None}
        return NormalizedPotentialFishingZone(
            external_id=f"incois-wfs:{year}:{ordinal}:{identifier}", name=f"INCOIS PFZ {sno}", geometry=geometry,
            sector=sector, source="INCOIS Potential Fishing Zone WebGIS", provider=self.name, source_url=INCOIS_PFZ_WEBGIS_URL,
            advisory_date=advisory_date, valid_from=None, valid_until=None, retrieved_at=now, status=zone_status,
            confidence=None, evidence=PFZEvidence(source="INCOIS Potential Fishing Zone WebGIS", source_url=INCOIS_PFZ_WEBGIS_URL, advisory_date=advisory_date, retrieved_at=now, source_timestamp=str(source_timestamp) if source_timestamp else None), metadata=metadata,
        )

    def health_status(self) -> PFZProviderAvailability:
        return PFZProviderAvailability.NOT_CONNECTED
