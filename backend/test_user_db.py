import sys
import traceback
from app.database.postgres import SessionLocal
from app.models.user import User

def test_db():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Success! Users count: {len(users)}")
    except Exception as e:
        print("Failed!")
        traceback.print_exc()

if __name__ == "__main__":
    test_db()
