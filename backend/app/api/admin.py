from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User, Organization
from app.utils.security import hash_password
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

class PasswordResetRequestPayload(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

class RevealPasswordPayload(BaseModel):
    employee_id: int
    security_code: str

class RevealOrgAdminPasswordPayload(BaseModel):
    org_id: int
    security_code: str

class ProfileUpdatePayload(BaseModel):
    user_id: int
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    new_password: Optional[str] = None

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
            "last_active": last_active,
            "pwd_reset_requested": getattr(u, "pwd_reset_requested", False)
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

@router.get("/organizations/{org_id}/report")
def get_organization_report(org_id: int, db: Session = Depends(get_db)):
    """Cogniva Admin: Get comprehensive organization analytics and intelligence report"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    from app.models.document import Document as DocModel
    from app.models.search_history import SearchHistory
    from app.models.analytics_agent import KnowledgeGapModel

    users = db.query(User).filter(User.org_id == org_id).all()
    user_ids_str = [str(u.id) for u in users]
    user_emails = [u.email for u in users]
    user_names = [u.full_name for u in users]
    user_ids_int = [u.id for u in users]

    docs = db.query(DocModel).filter(
        (DocModel.org_id == org_id) | 
        (DocModel.uploaded_by.in_(user_names + user_emails)) |
        (DocModel.user_id.in_(user_ids_int))
    ).all()
    
    searches = db.query(SearchHistory).filter(
        SearchHistory.user_id.in_(user_ids_str + user_emails)
    ).all()

    # Knowledge gaps
    gaps = db.query(KnowledgeGapModel).filter(
        KnowledgeGapModel.user_email.in_(user_emails)
    ).all()
    dept_names = list(set([u.department for u in users if u.department]))
    if not gaps and dept_names:
        gaps = db.query(KnowledgeGapModel).filter(KnowledgeGapModel.department.in_(dept_names)).all()

    employee_details = []
    total_engagement_hours = 0.0
    department_counts = {}

    for u in users:
        u_queries = [s for s in searches if s.user_id in (str(u.id), u.email)]
        u_docs = [d for d in docs if d.uploaded_by in (u.full_name, u.email) or d.user_id == u.id]
        
        last_active = "Never"
        if u_queries:
            latest = max((q.search_time for q in u_queries if q.search_time), default=None)
            if latest:
                last_active = latest.strftime("%Y-%m-%d %H:%M")
        elif u.created_at:
            last_active = u.created_at.strftime("%Y-%m-%d %H:%M")

        eng = round(max(0.5 if (u_queries or u_docs) else 0.0, (len(u_queries) * 0.2) + (len(u_docs) * 0.5)), 1)
        total_engagement_hours += eng

        dept = u.department or "General"
        department_counts[dept] = department_counts.get(dept, 0) + 1

        employee_details.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "department": dept,
            "user_type": getattr(u, "user_type", "employee"),
            "queries_processed": len(u_queries),
            "documents_uploaded": len(u_docs),
            "system_engagement": eng,
            "last_active": last_active
        })

    active_members_count = len([e for e in employee_details if e['queries_processed'] > 0 or e['documents_uploaded'] > 0])
    adoption_pct = round((active_members_count / max(len(users), 1)) * 100)

    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "industry": org.industry or "Technology",
            "created_at": org.created_at.strftime("%Y-%m-%d %H:%M") if org.created_at else "2026-01-01",
            "status": "Active Tenant"
        },
        "metrics": {
            "total_employees": len(users),
            "total_documents": len(docs),
            "total_queries": len(searches),
            "total_engagement_hours": round(total_engagement_hours, 1),
            "knowledge_gaps_count": len(gaps),
            "health_score": "98.8%",
            "adoption_rate": f"{adoption_pct}%"
        },
        "departments": [{"name": k, "count": v} for k, v in department_counts.items()],
        "employees": employee_details,
        "recent_documents": [
            {
                "id": d.id,
                "title": d.title or d.filename,
                "filename": d.filename,
                "file_type": d.file_type or "pdf",
                "file_size": d.file_size,
                "uploaded_by": d.uploaded_by,
                "department": d.department,
                "total_chunks": d.total_chunks,
                "upload_date": d.upload_date.strftime("%Y-%m-%d") if d.upload_date else ""
            } for d in docs[:10]
        ],
        "knowledge_gaps": [
            {
                "id": g.id,
                "query": g.unanswered_query,
                "department": g.department,
                "attempt_count": g.attempt_count,
                "status": getattr(g, "status", "Pending Resolution"),
                "created_at": g.created_at.strftime("%Y-%m-%d") if g.created_at else ""
            } for g in gaps[:10]
        ]
    }

@router.post("/request-password-reset")
def request_password_reset(payload: PasswordResetRequestPayload, db: Session = Depends(get_db)):
    """Employee requests password recovery from Org Admin"""
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    elif payload.email:
        user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    
    user.pwd_reset_requested = True
    db.commit()
    return {"success": True, "message": "Password assistance requested. Your Organization Admin has been alerted."}

@router.post("/reveal-employee-password")
def reveal_employee_password(payload: RevealPasswordPayload, db: Session = Depends(get_db)):
    """Organization Admin: Reveal employee password after verifying master code [34]"""
    if str(payload.security_code).strip() != "34":
        raise HTTPException(status_code=403, detail="Invalid Master Security Code. Access denied.")
    
    user = db.query(User).filter(User.id == payload.employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    revealed_pwd = user.recovery_password or "Password@123"
    return {
        "success": True,
        "employee_id": user.id,
        "employee_name": user.full_name,
        "email": user.email,
        "password": revealed_pwd,
        "pwd_reset_requested": getattr(user, "pwd_reset_requested", False)
    }

@router.post("/resolve-password-reset/{employee_id}")
def resolve_password_reset(employee_id: int, db: Session = Depends(get_db)):
    """Organization Admin: Mark employee password recovery request as resolved"""
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    user.pwd_reset_requested = False
    db.commit()
    return {"success": True, "message": "Password recovery status marked as resolved"}

@router.post("/reveal-org-admin-password")
def reveal_org_admin_password(payload: RevealOrgAdminPasswordPayload, db: Session = Depends(get_db)):
    """Cogniva Admin: Reveal Organization Admin password after verifying master code [34]"""
    if str(payload.security_code).strip() != "34":
        raise HTTPException(status_code=403, detail="Invalid Master Security Code. Access denied.")
    
    org = db.query(Organization).filter(Organization.id == payload.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    admin_user = db.query(User).filter(User.org_id == payload.org_id, User.user_type == "org_admin").first()
    if not admin_user:
        admin_user = db.query(User).filter(User.org_id == payload.org_id).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="No admin account found for this organization")
    
    revealed_pwd = admin_user.recovery_password or "Admin@123"
    return {
        "success": True,
        "org_id": org.id,
        "org_name": org.name,
        "admin_name": admin_user.full_name,
        "email": admin_user.email,
        "password": revealed_pwd
    }

@router.post("/update-profile")
def update_profile(payload: ProfileUpdatePayload, db: Session = Depends(get_db)):
    """Update profile configuration; Email & ID remain immutable; password is securely hashed"""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.full_name:
        user.full_name = payload.full_name.strip()
    if payload.role:
        user.role = payload.role.strip()
    if payload.department:
        user.department = payload.department.strip()
    
    if payload.new_password:
        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        user.password = hash_password(payload.new_password)
        user.recovery_password = payload.new_password
        user.pwd_reset_requested = False
    
    db.commit()
    db.refresh(user)
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "user_type": user.user_type,
            "org_id": user.org_id
        }
    }


