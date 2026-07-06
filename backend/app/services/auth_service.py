from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth_schema import RegisterRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(db: Session, user: RegisterRequest):
    """
    Register a new user
    """

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists."
        }

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        department=user.department
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Registration Successful"
    }


def login_user(db: Session, login: LoginRequest):
    """
    Login existing user
    """

    # Find user by email
    user = db.query(User).filter(
        User.email == login.email
    ).first()

    if user is None:
        return {
            "success": False,
            "message": "User not found"
        }

    # Verify password
    if not verify_password(
        login.password,
        user.password
    ):
        return {
            "success": False,
            "message": "Invalid Password"
        }

    # Generate JWT Token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "id": user.id
        }
    )

    return {
        "success": True,
        "message": "Login Successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department,
            "role": user.role
        }
    }