from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserPreferenceUpdate(BaseModel):
    department: Optional[str] = "Engineering & Product"
    role: Optional[str] = "Engineering Manager"
    language: Optional[str] = "English"
    preferred_tone: Optional[str] = "Professional"
    favorite_docs: Optional[List[str]] = []
    frequently_accessed: Optional[List[str]] = []

class EnterpriseDecisionCreate(BaseModel):
    title: str
    department: str
    decision: str
    reason: str
    priority: Optional[str] = "High"
    decision_date: Optional[str] = None
    owner: Optional[str] = "Enterprise Admin"
    tags: Optional[List[str]] = []
    status: Optional[str] = "Active"
    is_pinned: Optional[bool] = False

class ConversationMemoryCreate(BaseModel):
    query: str
    response: str
    summary: Optional[str] = None
    session_id: Optional[str] = "default_session"
    follow_up_references: Optional[List[str]] = []

class PinnedMemoryCreate(BaseModel):
    memory_type: str
    memory_ref_id: Optional[int] = None
    title: str
    content: str
    department: Optional[str] = "General Enterprise"

class SmartContextRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default_session"
    user_id: Optional[str] = "default_user"
    department: Optional[str] = None
