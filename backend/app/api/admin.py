from fastapi import APIRouter, Depends, HTTPException
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
def get_employees(db: Session = Depends(get_db)):
    """Organization Admin: List employees using Cogniva"""
    users = db.query(User).all()
    if not users:
        return [
            {"id": 1, "full_name": "Arshiy Jabeen", "email": "arshiy@xyz.com", "role": "Enterprise Analyst", "department": "Engineering & Product"},
            {"id": 2, "full_name": "Amreen Fathima", "email": "amreen@xyz.com", "role": "Data Scientist", "department": "Analytics"},
            {"id": 3, "full_name": "B Shireesha", "email": "shireesha@xyz.com", "role": "HR Manager", "department": "Human Resources"}
        ]
    results = []
    for u in users:
        results.append({
            "id": u.id, 
            "full_name": u.full_name, 
            "email": u.email, 
            "role": u.role, 
            "department": u.department,
            "queries_processed": 0,
            "system_engagement": 0,
            "last_active": "Never"
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
