from app.pfz_ranking.engine import PFZRankingEngine
from app.pfz_ranking.models import PFZCandidate

def candidate(identifier,distance=20,risk="LOW",geofence="CLEAR",route="SUCCESS",status="CURRENT"):
    return PFZCandidate(pfz_id=identifier,name=identifier,validity_status=status,distance_km=distance,marine_risk={"level":risk},geofence={"overall_status":geofence},route={"status":route},data_quality="HIGH",data_freshness="CURRENT")
def test_expired_nearby_candidate_never_beats_current():
    ranked=PFZRankingEngine().rank([candidate("expired",1,status="EXPIRED"),candidate("current",80)])
    assert ranked[0].pfz.pfz_id=="current" and not ranked[1].eligible
def test_prohibited_and_extreme_candidates_are_ineligible():
    ranked=PFZRankingEngine().rank([candidate("prohibited",geofence="PROHIBITED"),candidate("extreme",risk="EXTREME")])
    assert all(not item.eligible for item in ranked)
def test_safety_dominates_distance():
    ranked=PFZRankingEngine().rank([candidate("close-high",5,risk="HIGH"),candidate("far-low",45,risk="LOW")])
    assert ranked[0].pfz.pfz_id=="far-low"
def test_score_is_not_probability_and_is_deterministic():
    engine=PFZRankingEngine();items=[candidate("b",20),candidate("a",20)]
    first=engine.rank(items);second=engine.rank(items)
    assert [(x.pfz.pfz_id,x.recommendation_score) for x in first]==[(x.pfz.pfz_id,x.recommendation_score) for x in second]
    assert first[0].pfz.pfz_id=="a"
