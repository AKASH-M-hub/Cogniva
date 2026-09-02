import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.postgres import engine
from sqlalchemy import text

def alter_table():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE knowledge_gaps ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending Resolution';"))
        conn.commit()
        print("Column 'status' added successfully.")

if __name__ == "__main__":
    alter_table()
