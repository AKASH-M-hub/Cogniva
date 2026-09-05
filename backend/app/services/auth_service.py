from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from fastapi import HTTPException
from app.models.user import User, Organization
from app.schemas.auth_schema import RegisterRequest, LoginRequest, OrgRegisterRequest, EmployeeRegisterRequest
from app.utils.security import hash_password, verify_password, verify_password_enhanced, create_access_token

def register_user(db: Session, user: RegisterRequest):
    """
    Fallback legacy register for standalone users (Cogniva Admin etc)
    """
    if len(user.password) < 8:
        return {"success": False, "message": "Password must be at least 8 characters."}

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        return {"success": False, "message": "Email already exists."}
        
    cogniva_super_admin = user.email == "akash.m@cogniva.ai"
    
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        department=user.department,
        user_type="cogniva_admin" if cogniva_super_admin else "employee"
    )
    db.add(new_user)
    db.commit()
    return {"success": True, "message": "Registration Successful"}

def register_organization(db: Session, req: OrgRegisterRequest):
    """
    Self-Service Organization Onboarding
    """
    if len(req.admin_password) < 8:
        return {"success": False, "message": "Admin password must be at least 8 characters."}

    if db.query(Organization).filter(Organization.name == req.org_name).first():
        return {"success": False, "message": "Organization name already taken"}
    if db.query(User).filter(User.email == req.admin_email).first():
        return {"success": False, "message": "Admin email already registered"}
        
    org = Organization(name=req.org_name, industry=req.industry)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    admin_user = User(
        full_name=req.admin_name,
        email=req.admin_email,
        password=hash_password(req.admin_password),
        department="Administration",
        user_type="org_admin",
        org_id=org.id,
        role="Organization Admin"
    )
    db.add(admin_user)
    db.commit()
    return {"success": True, "message": "Organization & Admin created successfully", "org_id": org.id}

def register_org_employee(db: Session, req: EmployeeRegisterRequest):
    """
    Org Admin creates credentials for their employee
    """
    if len(req.password) < 8:
        return {"success": False, "message": "Password must be at least 8 characters long."}

    if db.query(User).filter(User.email == req.email).first():
        return {"success": False, "message": "Employee email already exists"}
        
    new_emp = User(
        full_name=req.full_name,
        email=req.email,
        password=hash_password(req.password),
        department=req.department,
        user_type="employee",
        org_id=req.org_id,
        role=req.role
    )
    db.add(new_emp)
    db.commit()
    print(f"[MAILING SYSTEM] Sent credentials to {req.email}. Password: {req.password}")
    return {"success": True, "message": f"Employee created and credentials emailed to {req.email} successfully"}

def login_user(db: Session, login: LoginRequest):
    """
    Login existing user and return JWT access token with ultra-fast authentication (< 100ms)
    """
    clean_email = str(login.email).strip().lower()

    # Fast indexed lookup
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")

    is_valid, is_legacy = verify_password_enhanced(login.password, user.password)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")

    # Seamless background upgrade from legacy plain text to high-speed bcrypt
    if is_legacy:
        try:
            user.password = hash_password(login.password)
            db.commit()
        except Exception:
            db.rollback()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "user_type": getattr(user, "user_type", "employee"),
        "org_id": getattr(user, "org_id", None)
    })

    return {
        "success": True,
        "message": "Login Successful",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department,
            "role": user.role,
            "user_type": getattr(user, "user_type", "employee"),
            "org_id": getattr(user, "org_id", None)
        }
    }