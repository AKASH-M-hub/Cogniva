from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database.base import Base

class AnalyticsAgentLogModel(Base):
    __tablename__ = "analytics_agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), index=True)  # search, response, document, memory
    metric_name = Column(String(100), index=True)
    metric_value = Column(Float, default=0.0)
    user_id = Column(String(100), default="EMP-2026-8942")
    department = Column(String(100), default="Engineering & Product")
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class KnowledgeGapModel(Base):
    __tablename__ = "knowledge_gaps"

    id = Column(Integer, primary_key=True, index=True)
    unanswered_query = Column(String(500), nullable=False, unique=True)
    department = Column(String(100), default="Engineering & Product")
    attempt_count = Column(Integer, default=1)
    status = Column(String(50), default="Pending Resolution")  # Pending Resolution, Resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
