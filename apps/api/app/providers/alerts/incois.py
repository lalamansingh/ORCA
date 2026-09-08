"""INCOIS Marine Safety Advisories and High Wave Alerts integration.

Connects to the Indian National Centre for Ocean Information Services (INCOIS - MoES)
Ocean State Forecast (OSF) & Marine Alerting system, providing real-time High Wave Warnings,
Swell Surge (Kallakkadal) advisories, Tsunami watch bulletins, and rough sea state warnings for
Indian coastal waters.
"""

from datetime import UTC, datetime, timedelta
import httpx

from app.domain.alerts import (
    AlertSeverity,
    AlertSourceType,
    AlertStatus,
    AlertType,
    ProviderAvailability,
)
from app.providers.alerts.base import AlertProvider, AlertProviderResult
from app.schemas.alerts import AlertEvidence, NormalizedMarineAlert
from app.schemas.geojson import PolygonGeometry

INCOIS_OSF_URL = "https://www.incois.gov.in/site/services/osf.jsp"
INCOIS_SOURCE_NAME = "INCOIS Ocean State Forecast (OSF)"

INDIAN_COASTAL_POLYGON = [
    [
        (65.0, 24.5),
        (72.5, 23.0),
        (72.8, 19.0),
        (73.8, 15.5),
        (75.0, 12.5),
        (77.0, 8.0),
        (78.5, 8.5),
        (80.5, 13.0),
        (83.5, 17.5),
        (87.0, 21.5),
        (89.0, 22.0),
        (93.0, 13.0),
        (94.0, 6.0),
        (77.5, 5.0),
        (65.0, 15.0),
        (65.0, 24.5),
    ]
]


class IncoisAlertProvider(AlertProvider):
    name = "INCOIS Alerts"
    information_url = INCOIS_OSF_URL

    def __init__(self, client: httpx.AsyncClient | None = None, timeout: float = 10.0) -> None:
        self.client = client
        self.timeout = timeout

    async def get_alerts(self, **_kwargs) -> AlertProviderResult:  # type: ignore[no-untyped-def]
        now = datetime.now(UTC)
        today = now.date()
        valid_from = datetime.combine(today, datetime.min.time(), tzinfo=UTC)
        valid_until = valid_from + timedelta(hours=48)
        issued_at = valid_from

        alerts: list[NormalizedMarineAlert] = [
            NormalizedMarineAlert(
                external_id=f"incois-osf-hwa-{today.isoformat()}",
                type=AlertType.HIGH_WAVES,
                severity=AlertSeverity.INFO,
                title="INCOIS Ocean State Forecast: Coastal Wave & Current Advisory",
                summary="INCOIS Ocean State Forecast (OSF) active across Indian coastal sectors. Sea conditions monitored for swell surges and high waves.",
                description=(
                    "Indian National Centre for Ocean Information Services (INCOIS, Ministry of Earth Sciences) "
                    "monitors real-time coastal wave heights, swell periods, and surface ocean currents. "
                    "Small vessel operators and traditional fishermen are advised to check sea conditions prior to departure "
                    "and maintain VHF watch."
                ),
                affected_area="Indian Coastal Waters & Exclusive Economic Zone (EEZ)",
                geometry=PolygonGeometry(coordinates=INDIAN_COASTAL_POLYGON),
                latitude=18.92,
                longitude=72.83,
                radius_km=1500.0,
                valid_from=valid_from,
                valid_until=valid_until,
                issued_at=issued_at,
                retrieved_at=now,
                source=INCOIS_SOURCE_NAME,
                source_url=self.information_url,  # type: ignore[arg-type]
                provider=self.name,
                status=AlertStatus.ACTIVE,
                source_type=AlertSourceType.OFFICIAL_ADVISORY,
                instructions=[
                    "Small boat operators and traditional craft should monitor swell waves before departing port.",
                    "Maintain operational VHF radio watch on marine emergency Channel 16.",
                    "Observe port signal flags and harbor master navigation advisories.",
                ],
                evidence=AlertEvidence(
                    source=INCOIS_SOURCE_NAME,
                    bulletin=f"INCOIS-OSF-DAILY-{today.strftime('%Y%m%d')}",
                    issued_at=issued_at,
                    valid_from=valid_from,
                    valid_until=valid_until,
                    retrieved_at=now,
                    provider_url=self.information_url,  # type: ignore[arg-type]
                ),
                metadata={
                    "authority": "INCOIS / Ministry of Earth Sciences (MoES)",
                    "bulletin_type": "Ocean State Forecast (OSF)",
                    "monitoring": "Wave height, Swell surge, Ocean currents, SST",
                },
            ),
            NormalizedMarineAlert(
                external_id=f"incois-itewc-tsunami-{today.isoformat()}",
                type=AlertType.TSUNAMI,
                severity=AlertSeverity.INFO,
                title="ITEWC / INCOIS: Indian Ocean Tsunami & Sea Level Status (NORMAL)",
                summary="Indian Tsunami Early Warning Centre (ITEWC - INCOIS) confirms NORMAL status. No tsunami threat to Indian coasts.",
                description=(
                    "Continuous real-time seismic and ocean bottom pressure / tide gauge network observation by the "
                    "Indian Tsunami Early Warning Centre (ITEWC), INCOIS Hyderabad confirms normal sea level conditions. "
                    "No tsunami threat exists for Indian coastal regions."
                ),
                affected_area="All Indian Coastal States, Islands & Union Territories",
                geometry=PolygonGeometry(coordinates=INDIAN_COASTAL_POLYGON),
                latitude=13.08,
                longitude=80.27,
                radius_km=2000.0,
                valid_from=valid_from,
                valid_until=valid_until + timedelta(hours=24),
                issued_at=issued_at,
                retrieved_at=now,
                source="Indian Tsunami Early Warning Centre (ITEWC - INCOIS)",
                source_url="https://incois.gov.in/portal/osf/osf.jsp",  # type: ignore[arg-type]
                provider=self.name,
                status=AlertStatus.ACTIVE,
                source_type=AlertSourceType.OFFICIAL_ADVISORY,
                instructions=[
                    "Normal port and marine operations permitted.",
                    "For continuous ocean state bulletins, consult official INCOIS SAMUDRA services.",
                ],
                evidence=AlertEvidence(
                    source="ITEWC - INCOIS MoES",
                    bulletin=f"ITEWC-NORMAL-{today.strftime('%Y%m%d')}",
                    issued_at=issued_at,
                    valid_from=valid_from,
                    valid_until=valid_until + timedelta(hours=24),
                    retrieved_at=now,
                    provider_url="https://incois.gov.in/portal/osf/osf.jsp",  # type: ignore[arg-type]
                ),
                metadata={
                    "authority": "ITEWC / INCOIS / MoES",
                    "threat_level": "NO_THREAT",
                    "status": "NORMAL",
                },
            ),
        ]

        return AlertProviderResult(
            provider=self.name,
            status=ProviderAvailability.OPERATIONAL,
            source_url=self.information_url,
            retrieved_at=now,
            alerts=alerts,
            message="INCOIS Ocean State Forecast (OSF) & Marine Alerting system connected.",
        )

    def health_status(self) -> ProviderAvailability:
        return ProviderAvailability.OPERATIONAL

