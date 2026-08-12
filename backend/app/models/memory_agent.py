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
