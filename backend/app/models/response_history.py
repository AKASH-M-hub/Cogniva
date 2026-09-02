from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database.base import Base


class ResponseHistory(Base):
    __tablename__ = "response_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="EMP-2026-8942")
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    model = Column(String(100), default="Ollama Qwen 2.5 3B")
    response_time = Column(Float, default=0.0)
    confidence_score = Column(Float, default=98.5)
    grounded_status = Column(String(50), default="100% Grounded")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
