from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.schemas.auth_schema import RegisterRequest
from app.schemas.auth_schema import LoginRequest

from app.services.auth_service import (
    register_user,
    login_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(

    user: RegisterRequest,

    db: Session = Depends(get_db)

):

    return register_user(
        db,
        user
    )


@router.post("/login")
def login(

    login: LoginRequest,

    db: Session = Depends(get_db)

):

    return login_user(
        db,
        login
    )