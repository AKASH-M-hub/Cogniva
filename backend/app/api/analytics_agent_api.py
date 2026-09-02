from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.services.analytics_agent_service import (
    get_full_analytics_overview,
    get_search_telemetry,
    get_response_telemetry,
    get_memory_telemetry,
    get_user_telemetry,
    get_enterprise_telemetry
)

router = APIRouter(
    prefix="/analytics-agent",
    tags=["Agent 5 – Analytics Agent (Continuous Analysis Engine)"]
)

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Get full multi-domain telemetry overview from Agent 5."""
    return get_full_analytics_overview(db)

@router.get("/search")
def get_search(db: Session = Depends(get_db)):
    """Get Search Agent telemetry."""
    return get_search_telemetry(db)

@router.get("/response")
def get_response(db: Session = Depends(get_db)):
    """Get Response Agent telemetry."""
    return get_response_telemetry(db)

@router.get("/memory")
def get_memory(db: Session = Depends(get_db)):
    """Get Memory Agent telemetry."""
    return get_memory_telemetry(db)

@router.get("/user")
def get_user(db: Session = Depends(get_db)):
    """Get User & Department usage telemetry."""
    return get_user_telemetry(db)

@router.get("/enterprise")
def get_enterprise(db: Session = Depends(get_db)):
    """Get Enterprise Knowledge & Knowledge Gap telemetry."""
    return get_enterprise_telemetry(db)

@router.get("/knowledge-gaps")
def get_knowledge_gaps(db: Session = Depends(get_db)):
    """Fetch all recorded 100% real Knowledge Gaps for Admin control center."""
    from app.models.analytics_agent import KnowledgeGapModel
    gaps = db.query(KnowledgeGapModel).order_by(KnowledgeGapModel.attempt_count.desc()).all()
    return [
        {
            "id": g.id,
            "query": g.unanswered_query,
            "department": g.department or "General",
            "employee": g.user_email or "Unknown",
            "attempts": g.attempt_count,
            "status": g.status,
            "created_at": g.created_at.strftime("%Y-%m-%d %H:%M") if g.created_at else "Recently"
        }
        for g in gaps
    ]

@router.post("/knowledge-gaps/{gap_id}/resolve")
def resolve_knowledge_gap(gap_id: int, db: Session = Depends(get_db)):
    """Mark a Knowledge Gap as Resolved by Admin."""
    from app.models.analytics_agent import KnowledgeGapModel
    gap = db.query(KnowledgeGapModel).filter(KnowledgeGapModel.id == gap_id).first()
    if gap:
        gap.status = "Resolved"
        db.commit()
        return {"success": True, "message": f"Knowledge Gap #{gap_id} marked as Resolved."}
    return {"success": False, "message": "Knowledge Gap not found."}
