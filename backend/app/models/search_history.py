from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database.base import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="EMP-2026-8942")
    query = Column(Text, nullable=False)
    department = Column(String(100), default="Engineering & Product")
    search_mode = Column(String(50), default="Hybrid (Dense Vector + BM25)")
    results_found = Column(Integer, default=0)
    top_similarity_score = Column(Float, default=0.0)
    execution_time_ms = Column(Float, default=0.0)
    search_time = Column(DateTime(timezone=True), server_default=func.now())
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
