from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database.base import Base

class ConversationMemoryModel(Base):
    __tablename__ = "conversation_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="EMP-2026-8942", index=True)
    session_id = Column(String(100), default="default_session", index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    follow_up_references = Column(JSON, nullable=True)
    importance_score = Column(Float, default=0.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class UserPreferenceModel(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="EMP-2026-8942", unique=True, index=True)
    department = Column(String(100), default="Engineering & Product")
    role = Column(String(100), default="Product Manager / Enterprise Analyst")
    language = Column(String(50), default="English")
    preferred_tone = Column(String(50), default="Professional")
    favorite_docs = Column(JSON, default=list)
    frequently_accessed = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EnterpriseDecisionModel(Base):
    __tablename__ = "enterprise_decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), default="Engineering & Product", index=True)
    decision = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String(50), default="High", index=True)
    decision_date = Column(String(50), nullable=True)
    owner = Column(String(100), default="Enterprise Admin")
    tags = Column(JSON, default=list)
    status = Column(String(50), default="Active", index=True)
    is_pinned = Column(Boolean, default=False, index=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PinnedMemoryModel(Base):
    __tablename__ = "pinned_memories"

    id = Column(Integer, primary_key=True, index=True)
    memory_type = Column(String(50), nullable=False)
    memory_ref_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    department = Column(String(100), default="General Enterprise")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecentContextModel(Base):
    __tablename__ = "recent_context"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="default_user", index=True)
    session_id = Column(String(100), default="default_session", index=True)
    context_summary = Column(Text, nullable=True)
    last_query = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MemoryAnalyticsModel(Base):
    __tablename__ = "memory_analytics"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), index=True)
    total_memories = Column(Integer, default=0)
    avg_retrieval_time_ms = Column(Float, default=14.2)
    context_accuracy = Column(Float, default=98.6)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

