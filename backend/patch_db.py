from app.database.postgres import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()
try:
    with engine.connect() as con:
        con.execute(text("ALTER TABLE knowledge_gaps ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT 'Unknown';"))
        con.commit()
    print("Column user_email added.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
