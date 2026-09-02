import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.postgres import engine
from sqlalchemy import text

def create_table():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_gaps (
                id SERIAL PRIMARY KEY,
                unanswered_query VARCHAR(255) UNIQUE NOT NULL,
                department VARCHAR(255),
                attempt_count INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()
        print("Table 'knowledge_gaps' created successfully.")

if __name__ == "__main__":
    create_table()
