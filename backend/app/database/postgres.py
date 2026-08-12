from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

from app.config.settings import settings
from app.database.base import Base

logger = logging.getLogger("cogniva_db")

# Try connecting to PostgreSQL first
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Connected to PostgreSQL database successfully.")
except Exception as e:
    logger.warning(f"PostgreSQL connection fallback triggered: {e}")
    # Fallback to local SQLite database if PostgreSQL server is not running
    engine = create_engine(
        "sqlite:///./cogniva.db",
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()