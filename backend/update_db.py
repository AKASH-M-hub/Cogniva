from sqlalchemy import text
from app.database.postgres import engine
from app.models.user import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_db():
    Base.metadata.create_all(bind=engine)
    
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'employee'"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id INTEGER"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id INTEGER"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id INTEGER"))
            conn.execute(text("ALTER TABLE memory_vault ADD COLUMN IF NOT EXISTS org_id INTEGER"))
            conn.execute(text("ALTER TABLE memory_vault ADD COLUMN IF NOT EXISTS user_id INTEGER"))
            logger.info("Database schema columns validated / updated successfully.")
        except Exception as e:
            logger.info(f"Schema update notice: {e}")

if __name__ == "__main__":
    update_db()
