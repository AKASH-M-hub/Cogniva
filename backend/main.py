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
from app.api.analytics import router as general_analytics_router
from app.api.notification import router as notification_router
from app.api.admin import router as admin_router

Base.metadata.create_all(bind=engine)


try:
    from update_db import update_db
    update_db()
except Exception as e:
    pass

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

from fastapi import Request

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(decision_router)
app.include_router(search_router)
app.include_router(orchestrator_router)
app.include_router(analytics_agent_router)
app.include_router(general_analytics_router)
app.include_router(notification_router)
app.include_router(admin_router)

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