from app.database.postgres import engine
from app.database.base import Base
import app.models.notification

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized (missing tables created).")

if __name__ == "__main__":
    init_db()
