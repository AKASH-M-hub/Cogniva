from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.postgres import get_db
from app.schemas.decision_schema import DecisionEvaluationRequest, DecisionEvaluationResponse
from app.services.decision_service import evaluate_and_route, get_decision_logs, get_decision_analytics

router = APIRouter(
    prefix="/decision",
    tags=["Decision Agent (Agent 4 - Brain of Cogniva)"]
)

@router.post("/evaluate", response_model=DecisionEvaluationResponse)
def evaluate_decision(req: DecisionEvaluationRequest, db: Session = Depends(get_db)):
    """
    Decision Agent Evaluation & Routing Endpoint (Agent 4)
    Analyzes query intent, validates search results, checks memory availability,
    determines retrieval strategy, and routes payload to Response Agent (Agent 1).
    """
    return evaluate_and_route(db, req)

@router.get("/logs")
def get_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Get live Decision Agent evaluation logs & history."""
    return get_decision_logs(db, limit=limit)

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """Get Decision Agent analytics metrics."""
    return get_decision_analytics(db)