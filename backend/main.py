from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.database.postgres import engine
from app.database.base import Base
from app.api.upload import router as upload_router
import app.models
from app.api.chat import router as chat_router
from app.api.memory import router as memory_router
from app.api.decision import router as decision_router
from app.api.search import router as search_router
from app.api.orchestrator import router as orchestrator_router
from app.api.analytics_agent_api import router as analytics_agent_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cogniva Enterprise Intelligence Platform",
    version="1.0.0"
)

from app.services.automation_service import start_automation_scheduler, shutdown_automation_scheduler

@app.on_event("startup")
def startup_event():
    start_automation_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    shutdown_automation_scheduler()

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(decision_router)
app.include_router(search_router)
app.include_router(orchestrator_router)
app.include_router(analytics_agent_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Cogniva Enterprise AI 🚀"
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