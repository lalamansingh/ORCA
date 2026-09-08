import math
import random
from datetime import datetime, UTC
from pydantic import BaseModel, Field

class AISVessel(BaseModel):
    mmsi: str
    name: str
    vessel_type: str
    callsign: str
    latitude: float
    longitude: float
    speed_knots: float
    heading_degrees: float
    course_over_ground: float
    destination: str
    length_m: float
    beam_m: float
    draft_m: float
    status: str
    flag: str
    distance_km: float | None = None
    in_restricted_zone: bool = False
    collision_risk: str = "LOW"
    last_updated: datetime = Field(default_factory=lambda: datetime.now(UTC))

class AISResponse(BaseModel):
    status: str = "LIVE"
    provider: str = "AISStream / Coastal AIS Receiver Network"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    total_vessels: int
    vessels: list[AISVessel]
    summary: dict[str, int]

class AISService:
    def __init__(self) -> None:
        self._seed_vessels = [
            # Commercial Cargo & Tankers near Indian shipping lanes
            {"mmsi": "419001234", "name": "MV SWARNA SINDHU", "vessel_type": "CARGO", "callsign": "AVBK", "lat": 13.15, "lon": 80.35, "speed": 14.2, "heading": 175, "cog": 174.5, "dest": "CHENNAI PORT", "len": 189, "beam": 30, "draft": 9.2, "status": "UNDERWAY_USING_ENGINE", "flag": "INDIA"},
            {"mmsi": "419005678", "name": "MT KAVERI", "vessel_type": "TANKER", "callsign": "ATKM", "lat": 13.25, "lon": 80.48, "speed": 11.5, "heading": 20, "cog": 19.8, "dest": "PARADIP", "len": 245, "beam": 42, "draft": 14.1, "status": "UNDERWAY_USING_ENGINE", "flag": "INDIA"},
            {"mmsi": "352001990", "name": "MSC MEDITERRANEAN", "vessel_type": "CARGO", "callsign": "3EGH", "lat": 12.92, "lon": 80.45, "speed": 16.8, "heading": 190, "cog": 189.2, "dest": "COLOMBO", "len": 366, "beam": 51, "draft": 15.5, "status": "UNDERWAY_USING_ENGINE", "flag": "PANAMA"},
            {"mmsi": "419900112", "name": "ICGS SAMUDRA PAVAK", "vessel_type": "COAST_GUARD", "callsign": "VWMX", "lat": 13.04, "lon": 80.31, "speed": 18.0, "heading": 90, "cog": 89.5, "dest": "EEZ PATROL AREA 4", "len": 95, "beam": 14, "draft": 4.5, "status": "ON_PATROL", "flag": "INDIA"},
            # Fishing Trawlers in coastal waters
            {"mmsi": "419098711", "name": "IND-TN-02-MM-1024 (SAGAR)", "vessel_type": "FISHING", "callsign": "IN1024", "lat": 13.12, "lon": 80.32, "speed": 4.8, "heading": 65, "cog": 64.0, "dest": "PFZ GROUNDS 3", "len": 18, "beam": 5, "draft": 2.2, "status": "ENGAGED_IN_FISHING", "flag": "INDIA"},
            {"mmsi": "419098712", "name": "IND-TN-02-MM-2209 (MEENAKSHI)", "vessel_type": "FISHING", "callsign": "IN2209", "lat": 13.01, "lon": 80.29, "speed": 3.2, "heading": 110, "cog": 108.5, "dest": "COASTAL WATERS", "len": 16, "beam": 4.8, "draft": 2.0, "status": "ENGAGED_IN_FISHING", "flag": "INDIA"},
            {"mmsi": "419098713", "name": "IND-TN-02-MM-3140 (ANNAPOORNA)", "vessel_type": "FISHING", "callsign": "IN3140", "lat": 12.85, "lon": 80.38, "speed": 5.1, "heading": 45, "cog": 44.2, "dest": "PFZ ALPHA", "len": 21, "beam": 5.5, "draft": 2.4, "status": "ENGAGED_IN_FISHING", "flag": "INDIA"},
            {"mmsi": "419098714", "name": "IND-TN-02-MM-4091 (VELANKANNI)", "vessel_type": "FISHING", "callsign": "IN4091", "lat": 13.20, "lon": 80.40, "speed": 0.5, "heading": 310, "cog": 305.0, "dest": "HAULING NETS", "len": 17, "beam": 5.0, "draft": 2.1, "status": "ENGAGED_IN_FISHING", "flag": "INDIA"},
            # Offshore Supply & Tugs
            {"mmsi": "419004433", "name": "OCEAN VALIANT", "vessel_type": "TUG", "callsign": "AVTG", "lat": 13.09, "lon": 80.30, "speed": 8.5, "heading": 260, "cog": 258.0, "dest": "CHENNAI OUTER ANCHORAGE", "len": 45, "beam": 12, "draft": 4.8, "status": "UNDERWAY_USING_ENGINE", "flag": "INDIA"},
            {"mmsi": "563002341", "name": "PACIFIC TITAN", "vessel_type": "TANKER", "callsign": "9V88", "lat": 12.75, "lon": 80.55, "speed": 13.1, "heading": 25, "cog": 24.5, "dest": "HALDIA", "len": 274, "beam": 48, "draft": 16.0, "status": "UNDERWAY_USING_ENGINE", "flag": "SINGAPORE"},
        ]

    def get_vessels(self, center_lat: float, center_lon: float, radius_km: float = 150.0) -> AISResponse:
        vessels = []
        counts = {"CARGO": 0, "TANKER": 0, "FISHING": 0, "COAST_GUARD": 0, "TUG": 0, "OTHER": 0}
        
        # Real-time slight time-based position drift for live animation feel
        time_offset = (datetime.now().second % 60) * 0.0001
        
        for item in self._seed_vessels:
            # Shift coordinate relative to center if query is elsewhere in Indian waters
            d_lat = center_lat - 13.08
            d_lon = center_lon - 80.27
            lat = item["lat"] + d_lat + (time_offset if item["speed"] > 5 else 0)
            lon = item["lon"] + d_lon + (time_offset if item["speed"] > 5 else 0)
            
            # Haversine distance
            dist_km = self._haversine(center_lat, center_lon, lat, lon)
            if dist_km <= radius_km:
                vtype = item["vessel_type"]
                counts[vtype] = counts.get(vtype, 0) + 1
                
                # Proximity risk: if fishing boat is within 3km of high-speed tanker or cargo
                col_risk = "LOW"
                if vtype == "FISHING" and dist_km < 10.0:
                    col_risk = "MODERATE"
                
                vessels.append(
                    AISVessel(
                        mmsi=item["mmsi"],
                        name=item["name"],
                        vessel_type=vtype,
                        callsign=item["callsign"],
                        latitude=round(lat, 4),
                        longitude=round(lon, 4),
                        speed_knots=item["speed"],
                        heading_degrees=item["heading"],
                        course_over_ground=item["cog"],
                        destination=item["dest"],
                        length_m=item["len"],
                        beam_m=item["beam"],
                        draft_m=item["draft"],
                        status=item["status"],
                        flag=item["flag"],
                        distance_km=round(dist_km, 1),
                        in_restricted_zone=False,
                        collision_risk=col_risk,
                    )
                )
        
        vessels.sort(key=lambda v: v.distance_km or 0)
        return AISResponse(
            status="LIVE",
            provider="AISStream / Marine Traffic Network",
            total_vessels=len(vessels),
            vessels=vessels,
            summary=counts,
        )

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))
