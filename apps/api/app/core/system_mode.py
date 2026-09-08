from enum import StrEnum

class SystemDataMode(StrEnum):LIVE="LIVE";DEMO="DEMO";MIXED="MIXED";DEGRADED="DEGRADED"
def derive_system_mode(statuses:list[str])->SystemDataMode:
    normalized={value.upper() for value in statuses}
    if "DEMO" in normalized and normalized & {"OPERATIONAL","LIVE"}:return SystemDataMode.MIXED
    if normalized=={"DEMO"}:return SystemDataMode.DEMO
    if normalized and normalized <= {"OPERATIONAL","LIVE","CURRENT"}:return SystemDataMode.LIVE
    return SystemDataMode.DEGRADED
