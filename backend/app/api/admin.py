from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User, Organization
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

# In-memory storage for vector chunk password for simplicity
_VECTOR_CHUNK_PASSWORD = "34"

class PasswordUpdate(BaseModel):
    new_password: str

class NotificationPayload(BaseModel):
    message: str
    target: str
    admin_password: str

@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Organization Admin: Revoke employee access"""
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        return {"success": False, "message": "Employee not found"}
    db.delete(user)
    db.commit()
    return {"success": True, "message": "Employee access revoked"}

@router.get("/employees")
def get_employees(org_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Organization Admin / Cogniva Admin: List employees with real operational metrics"""
    from app.models.search_history import SearchHistory
    from app.models.document import Document as DocModel

    query = db.query(User)
    if org_id is not None:
        query = query.filter(User.org_id == org_id)

    users = query.all()
    results = []
    for u in users:
        # Real query history count
        user_queries = db.query(SearchHistory).filter(
            (SearchHistory.user_id == str(u.id)) | (SearchHistory.user_id == u.email)
        ).all()
        query_count = len(user_queries)

        # Real documents count
        doc_count = db.query(DocModel).filter(
            (DocModel.uploaded_by == u.full_name) | (DocModel.uploaded_by == u.email)
        ).count()

        # Real last active time
        last_active = "Never"
        if user_queries:
            latest_search = max((q.search_time for q in user_queries if q.search_time), default=None)
            if latest_search:
                last_active = latest_search.strftime("%Y-%m-%d %H:%M")
        elif u.created_at:
            last_active = u.created_at.strftime("%Y-%m-%d %H:%M")

        engagement_hours = round(max(0.5 if (query_count or doc_count) else 0.0, (query_count * 0.2) + (doc_count * 0.5)), 1)

        results.append({
            "id": u.id, 
            "full_name": u.full_name, 
            "email": u.email, 
            "role": u.role, 
            "department": u.department,
            "user_type": getattr(u, "user_type", "employee"),
            "org_id": getattr(u, "org_id", None),
            "queries_processed": query_count,
            "documents_uploaded": doc_count,
            "system_engagement": engagement_hours,
            "last_active": last_active
        })
    return results


@router.post("/vector-password")
def set_vector_password(payload: PasswordUpdate):
    """Organization Admin: Set the password for vector chunks."""
    global _VECTOR_CHUNK_PASSWORD
    _VECTOR_CHUNK_PASSWORD = payload.new_password
    return {"message": "Vector chunk password updated successfully", "new_password": _VECTOR_CHUNK_PASSWORD}

@router.get("/vector-password")
def get_vector_password():
    """Get current vector password."""
    return {"password": _VECTOR_CHUNK_PASSWORD}

@router.post("/notify")
def send_notification(payload: NotificationPayload):
    """Cogniva Admin: Send notification to Org Admin or Employee webpage"""
    if payload.admin_password != "34":
        raise HTTPException(status_code=403, detail="Invalid Cogniva Admin Password")
    
    return {"message": f"Notification '{payload.message}' sent to {payload.target} successfully!"}

@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db)):
    """Cogniva Admin: List registered organizations"""
    orgs = db.query(Organization).all()
    return [{"id": o.id, "name": o.name, "industry": o.industry, "created_at": o.created_at} for o in orgs]

@router.delete("/organizations/{org_id}")
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """Cogniva Admin: Remove registered organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"success": False, "message": "Organization not found"}
    
    db.delete(org)
    db.commit()
    return {"success": True, "message": "Organization removed successfully"}
