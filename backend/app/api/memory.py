from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.postgres import get_db
from app.schemas.memory_agent_schema import (
    UserPreferenceUpdate,
    EnterpriseDecisionCreate,
    ConversationMemoryCreate,
    SmartContextRequest
)
from app.services.memory_agent_service import (
    get_user_preferences,
    update_user_preferences,
    get_enterprise_decisions,
    create_enterprise_decision,
    toggle_pin_decision,
    store_conversation_memory,
    get_conversation_memories,
    retrieve_smart_context,
    get_memory_agent_stats
)

router = APIRouter(
    prefix="/memory",
    tags=["Memory Agent (Agent 3)"]
)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get Memory Agent overall metrics & top statistics."""
    return get_memory_agent_stats(db)

@router.get("/user-preferences")
def get_preferences(user_id: str = "default_user", db: Session = Depends(get_db)):
    """Retrieve user preference memory (language, tone, department, role)."""
    return get_user_preferences(db, user_id=user_id)

@router.put("/user-preferences")
def update_preferences(data: UserPreferenceUpdate, user_id: str = "default_user", db: Session = Depends(get_db)):
    """Update user preference memory."""
    return update_user_preferences(db, user_id=user_id, data=data)

@router.get("/decisions")
def get_decisions(
    department: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve enterprise decision memories with optional filters."""
    return get_enterprise_decisions(db, department=department, priority=priority, search=search)

@router.post("/decisions")
def add_decision(data: EnterpriseDecisionCreate, db: Session = Depends(get_db)):
    """Log a new enterprise decision into Memory Agent."""
    return create_enterprise_decision(db, data=data)

@router.post("/decisions/{decision_id}/pin")
def pin_decision(decision_id: int, db: Session = Depends(get_db)):
    """Toggle pin status of an enterprise decision."""
    return toggle_pin_decision(db, decision_id=decision_id)

@router.get("/conversations")
def get_conversations(user_id: str = "default_user", limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve stored conversation memory and session context."""
    return get_conversation_memories(db, user_id=user_id, limit=limit)

@router.post("/conversations")
def add_conversation(data: ConversationMemoryCreate, user_id: str = "default_user", db: Session = Depends(get_db)):
    """Store conversation memory from Response Agent or User chat."""
    return store_conversation_memory(db, data=data, user_id=user_id)

@router.post("/smart-context")
def get_smart_context(req: SmartContextRequest, db: Session = Depends(get_db)):
    """
    Smart Context Retrieval Engine:
    Executed before Response Agent to assemble user preferences, conversation history,
    enterprise decisions, and ranked memory context.
    """
    return retrieve_smart_context(db, req)