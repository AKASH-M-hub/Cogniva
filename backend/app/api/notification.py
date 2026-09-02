from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.postgres import get_db
from app.models.notification import Notification
from pydantic import BaseModel

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

class NotificationWebhookPayload(BaseModel):
    user_id: str
    title: str
    message: str

@router.get("/")
def get_notifications(user_id: str = "EMP-2026-8942", db: Session = Depends(get_db)):
    """Fetch recent notifications for a user."""
    notifs = db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).limit(10).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]

@router.post("/webhook")
def receive_notification_webhook(payload: NotificationWebhookPayload, db: Session = Depends(get_db)):
    """Webhook for n8n to push notifications into Cogniva."""
    new_notif = Notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        is_read=False
    )
    db.add(new_notif)
    db.commit()
    return {"success": True, "message": "Notification created"}

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
