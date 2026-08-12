from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.postgres import get_db
from app.schemas.orchestrator_schema import OrchestrationRequest, OrchestrationResponse
from app.services.orchestrator_service import (
    analyze_and_plan,
    execute_orchestration,
    get_orchestration_logs,
    get_orchestration_analytics,
    get_user_orchestration_summary
)

router = APIRouter(
    prefix="/orchestrator",
    tags=["AI Orchestrator (Master Intelligence Layer)"]
)

@router.post("/plan")
def plan_orchestration(req: OrchestrationRequest):
    """
    AI Orchestrator Analysis & Agent Planning Endpoint
    Analyzes intent, complexity, and generates dynamic execution plan.
    """
    return analyze_and_plan(req.query, req.department or "Engineering & Product")

@router.post("/execute", response_model=OrchestrationResponse)
def run_orchestration(req: OrchestrationRequest, db: Session = Depends(get_db)):
    """
    Master AI Orchestrator Execution Endpoint
    Executes Search Agent, Memory Agent, Decision Agent, aggregates context,
    and packages payload for Response Agent (Agent 1).
    """
    return execute_orchestration(db, req)

@router.get("/logs")
def get_logs(user_id: Optional[str] = Query(None), limit: int = 50, db: Session = Depends(get_db)):
    """Get live AI Orchestrator execution logs & history, optionally filtered by user_id."""
    return get_orchestration_logs(db, user_id=user_id, limit=limit)

@router.get("/admin/users")
def get_admin_users(db: Session = Depends(get_db)):
    """Get list of active enterprise users and their AI Orchestrator summary."""
    return get_user_orchestration_summary(db)

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """Get AI Orchestrator analytics metrics & future-ready agent registry."""
    return get_orchestration_analytics(db)
