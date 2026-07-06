from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class Memory(Base):

    __tablename__ = "memory_vault"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    department = Column(
        String(100),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    decision = Column(
        String(1000),
        nullable=False
    )

    reason = Column(
        String(3000),
        nullable=False
    )

    priority = Column(
        String(50),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )