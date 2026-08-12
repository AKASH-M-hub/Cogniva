from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database.base import Base


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    searches = Column(Integer, default=0)
    uploads = Column(Integer, default=0)
    avg_latency = Column(Float, default=0.0)
    model_usage = Column(String(100), default="Qwen 2.5 3B Local")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
