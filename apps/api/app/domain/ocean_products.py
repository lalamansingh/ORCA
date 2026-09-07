from enum import StrEnum


class OceanProduct(StrEnum):
    SEA_SURFACE_TEMPERATURE = "SEA_SURFACE_TEMPERATURE"
    CHLOROPHYLL_A = "CHLOROPHYLL_A"


class OceanProductStatus(StrEnum):
    CURRENT = "CURRENT"
    RECENT = "RECENT"
    STALE = "STALE"
    EXPIRED = "EXPIRED"
    UNAVAILABLE = "UNAVAILABLE"
    NOT_CONNECTED = "NOT_CONNECTED"
    DEMO = "DEMO"


class OceanQuality(StrEnum):
    GOOD = "GOOD"
    ACCEPTABLE = "ACCEPTABLE"
    LOW_QUALITY = "LOW_QUALITY"
    NO_DATA = "NO_DATA"
    UNKNOWN = "UNKNOWN"
