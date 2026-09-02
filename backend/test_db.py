import sys
import traceback
from app.database.postgres import SessionLocal
from app.models.response_history import ResponseHistory

def test_db():
    db = SessionLocal()
    try:
        count = db.query(ResponseHistory).count()
        print(f"Success! Count: {count}")
    except Exception as e:
        print("Failed!")
        traceback.print_exc()

if __name__ == "__main__":
    test_db()
