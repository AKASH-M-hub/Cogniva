from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

from app.config.settings import settings
from app.database.base import Base

logger = logging.getLogger("cogniva_db")

# Fast database engine initialization with multi-candidate fallback
primary_url = settings.DATABASE_URL or ""

# Normalize postgres:// to postgresql:// for SQLAlchemy 2.0 compatibility
if primary_url.startswith("postgres://"):
    primary_url = primary_url.replace("postgres://", "postgresql://", 1)

candidate_urls = []
if primary_url and primary_url.startswith("postgresql"):
    candidate_urls.append(primary_url)

engine = None
for url in candidate_urls:
    try:
        candidate_engine = create_engine(
            url,
            connect_args={"connect_timeout": 1},
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            echo=False
        )
        with candidate_engine.connect() as conn:
            pass
        engine = candidate_engine
        logger.info(f"Connected to PostgreSQL database successfully at {url.split('@')[-1]}")
        break
    except Exception:
        pass

if engine is None:
    logger.info("Using local database engine: sqlite:///./cogniva.db")
    engine = create_engine(
        "sqlite:///./cogniva.db",
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Enable WAL mode on SQLite for fast concurrent access
    try:
        from sqlalchemy import event
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
    except Exception:
        pass

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