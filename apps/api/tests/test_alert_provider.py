from datetime import UTC, datetime

import httpx
import pytest

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.providers.alerts.imd_cap import ImdCapAlertProvider, parse_cap_alert
from app.providers.alerts.demo import DemoAlertProvider
from app.providers.errors import ProviderResponseError

NOW = datetime(2026, 9, 7, 12, tzinfo=UTC)


def cap_xml(*, identifier: str = "imd-test-1", event: str = "High Wave Warning", headline: str = "Provider headline", severity: str = "Severe", onset: str = "2026-09-07T14:00:00+05:30", expires: str = "2026-09-08T14:00:00+05:30", polygon: str = "13.0,80.2 13.1,80.2 13.1,80.4 13.0,80.2") -> str:
    return f'''<?xml version="1.0"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>{identifier}</identifier><sender>imd</sender><sent>2026-09-07T13:30:00+05:30</sent><status>Actual</status><msgType>Alert</msgType><scope>Public</scope><info><language>en-IN</language><category>Met</category><event>{event}</event><urgency>Expected</urgency><severity>{severity}</severity><certainty>Likely</certainty><onset>{onset}</onset><expires>{expires}</expires><senderName>India Meteorological Department</senderName><headline>{headline}</headline><description>Provider description</description><instruction>Follow official local authority instructions.</instruction><web>https://mausam.imd.gov.in/</web><area><areaDesc>Tamil Nadu coast</areaDesc><polygon>{polygon}</polygon></area></info></alert>'''


def test_cap_parser_normalizes_high_wave_geometry_and_timezone() -> None:
    alert = parse_cap_alert(cap_xml(), "https://cap-sources.s3.amazonaws.com/in-imd-en/test.xml", NOW)
    assert alert.type == AlertType.HIGH_WAVES
    assert alert.severity == AlertSeverity.SEVERE
    assert alert.status == AlertStatus.ACTIVE
    assert alert.geometry and alert.geometry.type == "Polygon"
    assert alert.geometry.coordinates[0][0] == (80.2, 13.0)
    assert alert.issued_at and alert.issued_at.utcoffset() is not None
    assert alert.metadata["cap_severity"] == "Severe"


def test_cap_lightning_is_labeled_as_risk_forecast_not_detection() -> None:
    alert = parse_cap_alert(cap_xml(event="Thunderstorm with Lightning", identifier="lightning-1"), "https://cap-sources.s3.amazonaws.com/in-imd-en/lightning.xml", NOW)
    assert alert.type == AlertType.LIGHTNING
    assert alert.title.startswith("Lightning risk forecast")
    assert alert.source_type == AlertSourceType.FORECAST_RISK
    assert alert.metadata["lightning_kind"] == "LIGHTNING_RISK_FORECAST"


def test_cap_expired_and_unknown_event_mapping() -> None:
    alert = parse_cap_alert(cap_xml(event="Local advisory", expires="2026-09-06T14:00:00+05:30"), "https://cap-sources.s3.amazonaws.com/in-imd-en/old.xml", NOW)
    assert alert.status == AlertStatus.EXPIRED
    assert alert.type == AlertType.OTHER


def test_cap_type_mapping_uses_headline_when_event_is_generic() -> None:
    alert = parse_cap_alert(cap_xml(event="Extremely heavy", headline="Heavy to very heavy rainfall"), "https://cap-sources.s3.amazonaws.com/in-imd-en/rain.xml", NOW)
    assert alert.type == AlertType.HEAVY_RAIN


@pytest.mark.parametrize(("event", "expected"), [("Swell Surge Advisory", AlertType.SWELL_SURGE), ("Storm Surge Warning", AlertType.STORM_SURGE), ("Cyclone Warning", AlertType.CYCLONE), ("Tsunami Bulletin", AlertType.TSUNAMI), ("Strong Wind and Squall", AlertType.STRONG_WIND), ("Dense Fog", AlertType.LOW_VISIBILITY)])
def test_cap_hazard_taxonomy(event: str, expected: AlertType) -> None:
    alert = parse_cap_alert(cap_xml(event=event), "https://cap-sources.s3.amazonaws.com/in-imd-en/taxonomy.xml", NOW)
    assert alert.type == expected


def test_cap_parser_rejects_malformed_or_entity_xml() -> None:
    with pytest.raises(ProviderResponseError):
        parse_cap_alert("<not-cap/>", "https://example.test/record.xml", NOW)
    with pytest.raises(ProviderResponseError):
        parse_cap_alert("<!DOCTYPE x [<!ENTITY y SYSTEM 'file:///etc/passwd'>]><x/>", "https://example.test/record.xml", NOW)


@pytest.mark.asyncio
async def test_imd_feed_reports_degraded_when_one_record_fails() -> None:
    feed = "<rss><channel><item><link>https://cap-sources.s3.amazonaws.com/in-imd-en/good.xml</link></item><item><link>https://cap-sources.s3.amazonaws.com/in-imd-en/bad.xml</link></item></channel></rss>"
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("rss.xml"):
            return httpx.Response(200, text=feed)
        if request.url.path.endswith("good.xml"):
            return httpx.Response(200, text=cap_xml())
        return httpx.Response(503)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = ImdCapAlertProvider(client, "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml", "https://cap-sources.s3.amazonaws.com/in-imd-en/", 1, 0, 20)
        result = await provider.get_alerts()
    assert result.status == ProviderAvailability.DEGRADED
    assert len(result.alerts) == 1
    assert "1 CAP record" in (result.message or "")


@pytest.mark.asyncio
async def test_imd_feed_does_not_follow_unconfigured_links() -> None:
    feed = "<rss><channel><item><link>https://attacker.example/alert.xml</link></item></channel></rss>"
    seen: list[str] = []
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        return httpx.Response(200, text=feed)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = ImdCapAlertProvider(client, "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml", "https://cap-sources.s3.amazonaws.com/in-imd-en/", 1, 0, 20)
        result = await provider.get_alerts()
    assert result.status == ProviderAvailability.OPERATIONAL
    assert len(seen) == 1


@pytest.mark.asyncio
async def test_demo_provider_is_unmistakably_labeled() -> None:
    result = await DemoAlertProvider().get_alerts()
    assert result.status == ProviderAvailability.DEMO
    assert result.alerts[0].source_type == AlertSourceType.DEMO
    assert "DEMO DATA" in result.alerts[0].title
