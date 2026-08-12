from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database.base import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="Active")
    last_run = Column(DateTime(timezone=True), server_default=func.now())
    config = Column(Text, nullable=True)
