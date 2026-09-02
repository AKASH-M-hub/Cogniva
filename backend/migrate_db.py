from app.database.postgres import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE documents ADD COLUMN title VARCHAR(255);"))
        conn.commit()
        print("Column 'title' successfully added to 'documents' table.")
    except Exception as e:
        print("Error or column already exists:", e)
