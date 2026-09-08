import asyncio
from datetime import UTC,datetime
from typing import Awaitable,Callable,Any
from app.pfz_ranking.engine import PFZRankingEngine
from app.pfz_ranking.models import PFZCandidate,PFZRecommendationResult,RecommendationStatus
from app.routing.models import RouteRequest

Enricher=Callable[[dict[str,float]],Awaitable[dict[str,Any]]]
class PFZRecommendationService:
    def __init__(self,pfz_service,risk_enricher:Enricher,geofence_enricher:Enricher,route_enricher:Callable[[RouteRequest],Awaitable[dict[str,Any]]],ocean_enricher:Enricher,engine:PFZRankingEngine|None=None,top_n:int=5,concurrency:int=3):self.pfz_service,self.risk,self.geofence,self.route,self.ocean,self.engine,self.top_n,self.concurrency=pfz_service,risk_enricher,geofence_enricher,route_enricher,ocean_enricher,engine or PFZRankingEngine(),top_n,concurrency
    async def recommend(self,origin:dict[str,float],requested_time:datetime|None=None,radius_km:float=500,max_results:int=5)->PFZRecommendationResult:
        response=await self.pfz_service.nearest(origin["latitude"],origin["longitude"],radius_km,min(max_results,self.top_n));now=datetime.now(UTC)
        if not response.pfzs:return PFZRecommendationResult(status=RecommendationStatus.UNAVAILABLE if response.status=="unavailable" else RecommendationStatus.NO_CURRENT_PFZ,origin=origin,requested_time=requested_time,candidate_count=0,eligible_count=0,excluded_count=0,generated_at=now,warnings=[response.result_state],limitations=response.limitations)
        semaphore=asyncio.Semaphore(self.concurrency)
        async def enrich(item):
            target=item.nearest_point.model_dump() if item.nearest_point else None
            if target is None:return PFZCandidate(pfz_id=str(item.id),name=item.name,geometry=item.geometry.model_dump(),validity_status=item.status.value,distance_km=item.distance_km or 0,geometry_valid=False,evidence=[item.evidence.model_dump(mode="json")])
            async with semaphore:
                results=await asyncio.gather(self.risk(target),self.geofence(target),self.route(RouteRequest(start=origin,destination=target,departure_time=requested_time)),self.ocean(target),return_exceptions=True)
            risk,geofence,route,ocean=[value if isinstance(value,dict) else None for value in results]
            return PFZCandidate(pfz_id=str(item.id),name=item.name,geometry=item.geometry.model_dump(),target_point=target,validity_status=item.status.value,advisory_date=item.advisory_date,valid_until=item.valid_until,distance_km=item.distance_km or 0,bearing_degrees=item.bearing_degrees,bearing_compass=item.bearing_cardinal,marine_risk=risk,geofence=geofence,route=route,sst=(ocean or {}).get("samples",{}),chlorophyll=(ocean or {}).get("samples",{}),data_quality="HIGH" if risk and geofence else "LOW",data_freshness="CURRENT" if item.status.value=="CURRENT" else item.status.value,evidence=[item.evidence.model_dump(mode="json")])
        candidates=await asyncio.gather(*(enrich(item) for item in response.pfzs));ranked=self.engine.rank(list(candidates));eligible=[item for item in ranked if item.eligible];status=RecommendationStatus.DEMO if any(item.pfz.validity_status=="DEMO" for item in ranked) else RecommendationStatus.SUCCESS if eligible else RecommendationStatus.NO_ELIGIBLE_PFZ
        return PFZRecommendationResult(status=status,origin=origin,requested_time=requested_time,ranked_candidates=ranked,recommended_candidate=eligible[0] if eligible else None,candidate_count=len(ranked),eligible_count=len(eligible),excluded_count=len(ranked)-len(eligible),methodology_version=self.engine.config.methodology_version,warnings=["Recommendation score is operational preference, not fish or catch probability."],evidence=[evidence for item in candidates for evidence in item.evidence],generated_at=now,limitations=["PFZ advisories indicate potential aggregation and do not guarantee catch."])
