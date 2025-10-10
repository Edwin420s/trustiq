from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import json
from datetime import datetime

from .services.trust_scorer import TrustScorer
from .services.data_analyzer import DataAnalyzer
from .models.trust_score import TrustScore, ScoreBreakdown

app = FastAPI(
    title="TrustIQ AI Engine",
    description="AI-powered reputation scoring engine",
    version="1.0.0"
)

trust_scorer = TrustScorer()
data_analyzer = DataAnalyzer()

class ScoringRequest(BaseModel):
    user_id: str
    accounts_data: Dict[str, Dict]
    on_chain_data: Optional[Dict] = None

class ScoringResponse(BaseModel):
    user_id: str
    trust_score: TrustScore
    breakdown: ScoreBreakdown
    insights: List[str]
    calculated_at: datetime

@app.post("/api/v1/calculate-trust-score", response_model=ScoringResponse)
async def calculate_trust_score(request: ScoringRequest):
    try:
        # Analyze data from different sources
        analysis_results = await data_analyzer.analyze_user_data(
            request.accounts_data,
            request.on_chain_data
        )
        
        # Calculate trust score
        trust_score = trust_scorer.calculate_score(analysis_results)
        
        # Generate insights
        insights = trust_scorer.generate_insights(analysis_results, trust_score)
        
        response = ScoringResponse(
            user_id=request.user_id,
            trust_score=trust_score,
            breakdown=analysis_results,
            insights=insights,
            calculated_at=datetime.utcnow()
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "trustiq-ai-engine"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)