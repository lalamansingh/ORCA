import math
from app.pfz_ranking.models import *

RISK_SCORE={"LOW":100,"MODERATE":65,"HIGH":25,"EXTREME":0,"UNAVAILABLE":20};QUALITY={"HIGH":100,"MEDIUM":70,"LOW":35,"INSUFFICIENT":0};FRESHNESS={"CURRENT":100,"STALE":35,"UNKNOWN":20};ROUTE_BAD={"NO_FEASIBLE_ROUTE","TARGET_RESTRICTED","OUTSIDE_ROUTING_DOMAIN"}
class PFZRankingEngine:
    def __init__(self,config:PFZRankingConfig|None=None):self.config=config or PFZRankingConfig()
    def rank(self,candidates:list[PFZCandidate])->list[RankedPFZCandidate]:
        ranked=[self._score(candidate) for candidate in candidates];eligible=[item for item in ranked if item.eligible];excluded=[item for item in ranked if not item.eligible]
        eligible.sort(key=lambda item:(-item.recommendation_score,RISK_SCORE.get(self._risk(item.pfz),0)*-1,item.pfz.distance_km,item.pfz.pfz_id));excluded.sort(key=lambda item:(item.exclusion_reasons,item.pfz.pfz_id))
        result=eligible+excluded
        for index,item in enumerate(result,1):item.rank=index
        return result
    def _score(self,candidate:PFZCandidate)->RankedPFZCandidate:
        exclusions=[];risk=self._risk(candidate);geofence=(candidate.geofence or {}).get("overall_status","UNKNOWN");route=(candidate.route or {}).get("status","UNAVAILABLE")
        if candidate.validity_status not in {"CURRENT","DEMO"}:exclusions.append("PFZ_NOT_CURRENT")
        if not candidate.geometry_valid:exclusions.append("INVALID_GEOMETRY")
        if not candidate.inside_supported_domain:exclusions.append("OUTSIDE_SUPPORTED_REGION")
        if geofence=="PROHIBITED":exclusions.append("GEOFENCE_PROHIBITED")
        if route in ROUTE_BAD:exclusions.append("NO_FEASIBLE_ROUTE")
        if risk=="EXTREME" and self.config.extreme_risk_ineligible:exclusions.append("EXTREME_MARINE_RISK")
        if any(str(item.get("severity"))=="CRITICAL" for item in candidate.alerts):exclusions.append("CRITICAL_ALERT")
        distance=max(0,100*(1-math.log1p(candidate.distance_km)/math.log1p(self.config.max_distance_km)));route_score=100 if route in {"SUCCESS","DEMO"} else 45 if route=="PARTIAL" else 20;access=100 if geofence=="CLEAR" else 55 if geofence=="CAUTION" else self.config.unknown_geofence_score
        safety=min(RISK_SCORE.get(risk,20),access) # cap correlated safety signals instead of double counting them
        values=[("safety",risk,safety,self.config.risk_weight,"Worst of marine risk and access"),("distance",candidate.distance_km,distance,self.config.distance_weight,"Smooth logarithmic distance decay"),("route",route,route_score,self.config.route_weight,"Existing route feasibility"),("data_quality",candidate.data_quality,QUALITY.get(candidate.data_quality,0),self.config.data_quality_weight,"Critical input completeness"),("freshness",candidate.data_freshness,FRESHNESS.get(candidate.data_freshness,20),self.config.freshness_weight,"Source freshness"),("environment_context","AVAILABLE" if candidate.sst or candidate.chlorophyll else "UNAVAILABLE",100 if candidate.sst or candidate.chlorophyll else 0,self.config.environment_context_weight,"Context only; not fish probability")]
        components=[PFZScoreComponent(name=name,raw_value=raw,normalized_score=round(value,2),weight=weight,weighted_contribution=round(value*weight,2),reason=reason) for name,raw,value,weight,reason in values];score=round(sum(item.weighted_contribution for item in components),2)
        band=RecommendationBand.STRONG_CANDIDATE if score>=80 else RecommendationBand.GOOD_CANDIDATE if score>=60 else RecommendationBand.CAUTION if score>=40 else RecommendationBand.LOW_PREFERENCE
        positives=["Current official PFZ advisory"] if candidate.validity_status=="CURRENT" else [];negatives=[] if risk=="LOW" else [f"Marine risk is {risk}"];gaps=[name for name,value in (("marine risk",candidate.marine_risk),("geofence",candidate.geofence),("route",candidate.route)) if value is None]
        explanation=PFZRecommendationExplanation(positive_factors=positives,negative_factors=negatives,safety_constraints=exclusions,data_gaps=gaps,why_ranked_here="Rank is based on eligibility, safety/access, route feasibility, travel distance, freshness, and data quality—not predicted catch.")
        return RankedPFZCandidate(pfz=candidate,recommendation_score=score,recommendation_band=band,eligible=not exclusions,exclusion_reasons=exclusions,score_components=components,strengths=positives,tradeoffs=negatives,warnings=["PFZ indicates potential aggregation and does not guarantee catch."],evidence_refs=[str(item.get("evidence_id")) for item in candidate.evidence if item.get("evidence_id")],explanation=explanation)
    @staticmethod
    def _risk(candidate:PFZCandidate)->str:return str((candidate.marine_risk or {}).get("risk_level",(candidate.marine_risk or {}).get("level","UNAVAILABLE")))
