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
            conn.execute(text("ALTER TABLE users ADD COLUMN user_type VARCHAR(50) DEFAULT 'employee'"))
            logger.info("Added user_type column.")
        except Exception as e:
            logger.info(f"Column user_type might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN org_id INTEGER"))
            logger.info("Added org_id column to users.")
        except Exception as e:
            logger.info(f"Column org_id in users might already exist: {e}")

        # Multi-Tenant & User Ownership for Documents
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN org_id INTEGER"))
            logger.info("Added org_id column to documents.")
        except Exception as e:
            logger.info(f"Column org_id in documents might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN user_id INTEGER"))
            logger.info("Added user_id column to documents.")
        except Exception as e:
            logger.info(f"Column user_id in documents might already exist: {e}")

        # Multi-Tenant & User Ownership for Memories
        try:
            conn.execute(text("ALTER TABLE memory_vault ADD COLUMN org_id INTEGER"))
            logger.info("Added org_id column to memory_vault.")
        except Exception as e:
            pass

        try:
            conn.execute(text("ALTER TABLE memory_vault ADD COLUMN user_id INTEGER"))
            logger.info("Added user_id column to memory_vault.")
        except Exception as e:
            pass

if __name__ == "__main__":
    update_db()
