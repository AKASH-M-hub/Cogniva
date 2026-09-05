from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    industry = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False, default="Enterprise Employee")
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True)
    role = Column(String(100), default="Enterprise Employee")
    department = Column(String(100), default="General")
    
    # New Auth Fields
    user_type = Column(String(50), default="employee") # employee, org_admin, cogniva_admin
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    organization = relationship("Organization", back_populates="users")