from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database.base import Base

class DecisionLogModel(Base):
    __tablename__ = "decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="default_user", index=True)
    query = Column(Text, nullable=False)
    intent = Column(String(100), nullable=False, index=True)  # Explanation, Policy Check, Decision Support, Technical Deep-Dive
    complexity = Column(String(50), default="Medium", index=True)  # Low, Medium, High, Critical
    department = Column(String(100), default="Engineering & Product", index=True)
    search_confidence_score = Column(Float, default=95.0)
    enough_context = Column(Boolean, default=True)
    memory_consulted = Column(Boolean, default=True)
    multiple_docs_needed = Column(Boolean, default=False)
    retrieval_strategy = Column(String(255), nullable=False)  # e.g. "Semantic Search + Conversation Memory + Enterprise Decisions"
    recommendation = Column(Text, nullable=False)
    reasons = Column(JSON, default=list)
    confidence_score = Column(Float, default=96.5)
    routing_target = Column(String(100), default="Response Agent (Agent 1)")
    decision_latency_ms = Column(Float, default=12.8)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class DecisionAnalyticsSummaryModel(Base):
    __tablename__ = "decision_analytics_summary"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), index=True)
    total_decisions = Column(Integer, default=0)
    avg_decision_time_ms = Column(Float, default=12.8)
    search_success_rate = Column(Float, default=97.5)
    memory_utilization_rate = Column(Float, default=94.2)
    routing_accuracy = Column(Float, default=99.4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
