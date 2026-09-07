"""Official IMD Common Alerting Protocol RSS adapter."""

import asyncio
import re
from datetime import UTC, datetime
from urllib.parse import urlparse
from xml.etree import ElementTree

import httpx

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.providers.alerts.base import AlertProvider, AlertProviderResult
from app.providers.errors import ProviderError, ProviderResponseError
from app.providers.http import get_text
from app.schemas.alerts import AlertEvidence, NormalizedMarineAlert
from app.schemas.geojson import MultiPolygonGeometry, PolygonGeometry

CAP_NS = "urn:oasis:names:tc:emergency:cap:1.2"


def _text(element: ElementTree.Element, name: str, limit: int = 12000) -> str | None:
    node = element.find(f"{{{CAP_NS}}}{name}")
    if node is None or not node.text:
        return None
    value = " ".join(node.text.replace("\x00", " ").split())
    return value[:limit] or None


def _date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ProviderResponseError("IMD CAP alert contains an invalid timestamp.") from exc
    if parsed.tzinfo is None:
        raise ProviderResponseError("IMD CAP alert timestamp has no timezone.")
    return parsed


def _type(event: str) -> AlertType:
    value = event.lower()
    mappings = (
        ("tsunami", AlertType.TSUNAMI),
        ("cyclone", AlertType.CYCLONE),
        ("storm surge", AlertType.STORM_SURGE),
        ("swell surge", AlertType.SWELL_SURGE),
        ("high wave", AlertType.HIGH_WAVES),
        ("lightning", AlertType.LIGHTNING),
        ("thunderstorm", AlertType.LIGHTNING),
        ("heavy rain", AlertType.HEAVY_RAIN),
        ("rainfall", AlertType.HEAVY_RAIN),
        ("strong wind", AlertType.STRONG_WIND),
        ("squall", AlertType.STRONG_WIND),
        ("visibility", AlertType.LOW_VISIBILITY),
        ("fog", AlertType.LOW_VISIBILITY),
        ("marine heat", AlertType.MARINE_HEAT_WAVE),
    )
    return next((alert_type for keyword, alert_type in mappings if keyword in value), AlertType.OTHER)


def _severity(value: str | None) -> AlertSeverity:
    return {
        "minor": AlertSeverity.INFO,
        "moderate": AlertSeverity.WATCH,
        "severe": AlertSeverity.SEVERE,
        "extreme": AlertSeverity.CRITICAL,
    }.get((value or "").lower(), AlertSeverity.WARNING)


def _status(root: ElementTree.Element, onset: datetime | None, expires: datetime | None, now: datetime) -> AlertStatus:
    if (_text(root, "msgType", 32) or "").lower() == "cancel":
        return AlertStatus.CANCELLED
    if expires and now > expires.astimezone(UTC):
        return AlertStatus.EXPIRED
    if onset and now < onset.astimezone(UTC):
        return AlertStatus.UPCOMING
    return AlertStatus.ACTIVE if expires or onset else AlertStatus.UNKNOWN


def _polygon(value: str | None) -> list[tuple[float, float]] | None:
    if not value:
        return None
    coordinates: list[tuple[float, float]] = []
    for pair in value.split():
        parts = pair.split(",")
        if len(parts) != 2:
            return None
        try:
            latitude, longitude = float(parts[0]), float(parts[1])
        except ValueError:
            return None
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            return None
        coordinates.append((longitude, latitude))
    if len(coordinates) < 3:
        return None
    if coordinates[0] != coordinates[-1]:
        coordinates.append(coordinates[0])
    return coordinates if len(coordinates) >= 4 else None


def _geometry(info: ElementTree.Element) -> PolygonGeometry | MultiPolygonGeometry | None:
    polygons = []
    for area in info.findall(f"{{{CAP_NS}}}area"):
        polygon = _polygon(_text(area, "polygon", 100_000))
        if polygon:
            polygons.append([polygon])
    if len(polygons) == 1:
        return PolygonGeometry(coordinates=polygons[0])
    if polygons:
        return MultiPolygonGeometry(coordinates=polygons)
    return None


def parse_cap_alert(xml: str, record_url: str, retrieved_at: datetime) -> NormalizedMarineAlert:
    if len(xml.encode("utf-8")) > 1_000_000 or "<!DOCTYPE" in xml.upper() or "<!ENTITY" in xml.upper():
        raise ProviderResponseError("IMD CAP alert failed XML safety validation.")
    try:
        root = ElementTree.fromstring(xml)
    except ElementTree.ParseError as exc:
        raise ProviderResponseError("IMD CAP alert contains malformed XML.") from exc
    if root.tag != f"{{{CAP_NS}}}alert":
        raise ProviderResponseError("IMD CAP alert has an unsupported document type.")
    infos = root.findall(f"{{{CAP_NS}}}info")
    if not infos:
        raise ProviderResponseError("IMD CAP alert contains no information block.")
    info = next((item for item in infos if (_text(item, "language", 32) or "en").lower().startswith("en")), infos[0])
    external_id = _text(root, "identifier", 255)
    event = _text(info, "event", 255)
    if not external_id or not event:
        raise ProviderResponseError("IMD CAP alert is missing its identifier or event.")
    onset = _date(_text(info, "onset", 64) or _text(info, "effective", 64))
    expires = _date(_text(info, "expires", 64))
    issued = _date(_text(root, "sent", 64))
    headline = _text(info, "headline", 255) or event
    description = _text(info, "description")
    alert_type = _type(f"{event} {headline} {description or ''}")
    if alert_type == AlertType.LIGHTNING:
        headline = f"Lightning risk forecast — {headline}"[:255]
    areas = [_text(area, "areaDesc", 1000) for area in info.findall(f"{{{CAP_NS}}}area")]
    affected_area = "; ".join(dict.fromkeys(area for area in areas if area))[:1000] or None
    instruction = _text(info, "instruction", 5000)
    raw_severity = _text(info, "severity", 64)
    source_url = _text(info, "web", 2048) or record_url
    status = _status(root, onset, expires, retrieved_at)
    source_type = AlertSourceType.FORECAST_RISK if alert_type == AlertType.LIGHTNING else AlertSourceType.OFFICIAL_ADVISORY
    return NormalizedMarineAlert(
        external_id=external_id,
        type=alert_type,
        severity=_severity(raw_severity),
        title=headline,
        summary=event,
        description=description,
        affected_area=affected_area,
        geometry=_geometry(info),
        valid_from=onset,
        valid_until=expires,
        issued_at=issued,
        updated_at=issued,
        retrieved_at=retrieved_at,
        source=_text(root, "senderName", 255) or "India Meteorological Department",
        source_url=source_url,
        provider="IMD CAP",
        status=status,
        source_type=source_type,
        instructions=[instruction] if instruction else [],
        evidence=AlertEvidence(source="India Meteorological Department", bulletin=event, issued_at=issued, valid_from=onset, valid_until=expires, retrieved_at=retrieved_at, provider_url=source_url),
        metadata={
            "cap_status": _text(root, "status", 64) or "",
            "cap_message_type": _text(root, "msgType", 64) or "",
            "cap_urgency": _text(info, "urgency", 64) or "",
            "cap_severity": raw_severity or "",
            "cap_certainty": _text(info, "certainty", 64) or "",
            "lightning_kind": "LIGHTNING_RISK_FORECAST" if alert_type == AlertType.LIGHTNING else "",
        },
    )


class ImdCapAlertProvider(AlertProvider):
    name = "IMD CAP"

    def __init__(self, client: httpx.AsyncClient, feed_url: str, cap_base_url: str, timeout: float, retries: int, max_items: int) -> None:
        self.client = client
        self.feed_url = feed_url
        self.cap_base_url = cap_base_url
        self.timeout = timeout
        self.retries = retries
        self.max_items = max_items

    def _allowed_record_url(self, url: str) -> bool:
        candidate, allowed = urlparse(url), urlparse(self.cap_base_url)
        return candidate.scheme == "https" and candidate.netloc == allowed.netloc and candidate.path.startswith(allowed.path) and candidate.path.endswith(".xml")

    async def get_alerts(self, **_kwargs) -> AlertProviderResult:  # type: ignore[no-untyped-def]
        retrieved_at = datetime.now(UTC)
        rss = await get_text(self.client, self.feed_url, self.timeout, self.retries)
        if len(rss.encode("utf-8")) > 1_000_000 or re.search(r"<!DOCTYPE|<!ENTITY", rss, re.IGNORECASE):
            raise ProviderResponseError("IMD CAP feed failed XML safety validation.")
        try:
            root = ElementTree.fromstring(rss)
        except ElementTree.ParseError as exc:
            raise ProviderResponseError("IMD CAP feed contains malformed XML.") from exc
        links = []
        for item in root.findall(".//item")[: self.max_items]:
            link = item.findtext("link")
            if link and self._allowed_record_url(link.strip()):
                links.append(link.strip())
        if not links:
            return AlertProviderResult(provider=self.name, status=ProviderAvailability.OPERATIONAL, source_url=self.feed_url, retrieved_at=retrieved_at, message="Official feed was available and contained no supported CAP records.")
        documents = await asyncio.gather(*(get_text(self.client, link, self.timeout, self.retries) for link in links), return_exceptions=True)
        alerts: list[NormalizedMarineAlert] = []
        failures = 0
        for link, document in zip(links, documents, strict=True):
            if isinstance(document, BaseException):
                failures += 1
                continue
            try:
                alerts.append(parse_cap_alert(document, link, retrieved_at))
            except ProviderError:
                failures += 1
        if not alerts and failures:
            raise ProviderResponseError("IMD CAP records could not be safely parsed.")
        status = ProviderAvailability.DEGRADED if failures else ProviderAvailability.OPERATIONAL
        message = f"{failures} CAP record(s) could not be retrieved or parsed." if failures else None
        return AlertProviderResult(provider=self.name, status=status, source_url=self.feed_url, retrieved_at=retrieved_at, alerts=alerts, message=message)

    def health_status(self) -> ProviderAvailability:
        return ProviderAvailability.OPERATIONAL
