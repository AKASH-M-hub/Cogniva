from fastapi import FastAPI
from sqlalchemy import text
from app.api.auth import router as auth_router
from app.database.postgres import engine
from app.database.base import Base
from app.api.upload import router as upload_router
import app.models
from app.api.chat import router as chat_router
from app.api.memory import router as memory_router
from app.models.memory import Memory
from app.api.decision import router as decision_router
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cogniva Enterprise Intelligence Platform",
    version="1.0.0"
)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(decision_router)
@app.get("/")
def home():
    return {
        "message": "Welcome to Cogniva 🚀"
    }


@app.get("/db-test")
def database_test():

    try:

        with engine.connect() as connection:

            connection.execute(text("SELECT 1"))

        return {
            "database": "Connected Successfully ✅"
        }

    except Exception as e:

        return {
            "database": "Connection Failed ❌",
            "error": str(e)
        }