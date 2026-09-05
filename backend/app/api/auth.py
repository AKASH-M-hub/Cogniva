from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    OrgRegisterRequest,
    EmployeeRegisterRequest
)

from app.services.auth_service import (
    register_user,
    login_user,
    register_organization,
    register_org_employee
)
from pydantic import BaseModel
from app.models.user import User
from app.utils.security import hash_password

class CognivaAdminRegisterRequest(BaseModel):
    admin_name: str
    admin_email: str
    admin_password: str

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register(user: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, user)

@router.post("/register/organization")
def register_org(req: OrgRegisterRequest, db: Session = Depends(get_db)):
    return register_organization(db, req)

@router.post("/register/cogniva-admin")
def register_cogniva_admin(req: CognivaAdminRegisterRequest, db: Session = Depends(get_db)):
    if len(req.admin_password) < 8:
        return {"success": False, "message": "Admin password must be at least 8 characters long"}
    if db.query(User).filter(User.email == req.admin_email).first():
        return {"success": False, "message": "Admin email already registered"}
    admin_user = User(
        full_name=req.admin_name,
        email=req.admin_email,
        password=hash_password(req.admin_password),
        department="Core Infrastructure",
        user_type="cogniva_admin",
        role="Master System Admin"
    )
    db.add(admin_user)
    db.commit()
    return {"success": True, "message": "Cogniva Admin created successfully"}
    
@router.post("/register/employee")
def register_employee(req: EmployeeRegisterRequest, db: Session = Depends(get_db)):
    return register_org_employee(db, req)

@router.post("/login")
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, login_req)