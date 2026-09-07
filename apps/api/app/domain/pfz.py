"""Provider-neutral PFZ states.  These states deliberately separate source freshness from geometry."""

from enum import StrEnum


class PFZStatus(StrEnum):
    CURRENT = "CURRENT"
    STALE = "STALE"
    EXPIRED = "EXPIRED"
    DEMO = "DEMO"
    UPCOMING = "UPCOMING"


class PFZProviderAvailability(StrEnum):
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"
    UNAVAILABLE = "UNAVAILABLE"
    NOT_CONNECTED = "NOT_CONNECTED"
    REQUIRES_ACCESS = "REQUIRES_ACCESS"
    DEMO = "DEMO"
