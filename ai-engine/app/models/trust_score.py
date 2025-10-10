from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class ScoreBreakdown(BaseModel):
    consistency: float
    skill_depth: float
    peer_validation: float
    engagement_quality: float
    anomaly_factor: float

class TrustScore(BaseModel):
    score: float
    breakdown: ScoreBreakdown

class AnalysisResults(BaseModel):
    github: Optional[Dict] = None
    linkedin: Optional[Dict] = None
    on_chain: Optional[Dict] = None

class ScoringRequest(BaseModel):
    user_id: str
    accounts_data: Dict[str, Dict]
    on_chain_data: Optional[Dict] = None

class ScoringResponse(BaseModel):
    user_id: str
    trust_score: float
    breakdown: Dict
    insights: List[str]
    calculated_at: datetime