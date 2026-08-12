from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False, default="Akash M")
    email = Column(String(150), unique=True, nullable=False, default="akash.m@cogniva.ai")
    employee_id = Column(String(50), nullable=True, default="EMP-2026-8942")
    password = Column(String(255), nullable=True, default="hashed_password")
    role = Column(String(100), default="Product Manager / Enterprise Analyst")
    department = Column(String(100), default="Engineering & Product")
    created_at = Column(DateTime(timezone=True), server_default=func.now())