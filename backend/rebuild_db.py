import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.postgres import engine
from app.database.base import Base
import app.models  # Load all models into Base.metadata

def rebuild_database():
    print("Rebuilding Cogniva Enterprise database tables...")
    try:
        # Create all tables cleanly
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables successfully created and synchronized!")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")

if __name__ == "__main__":
    rebuild_database()
