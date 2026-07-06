from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.schemas.decision_schema import DecisionRequest

from app.services.decision_service import generate_decision

router = APIRouter(
    prefix="/decision",
    tags=["Decision Agent"]
)


@router.post("/")
def decision(

    request: DecisionRequest,

    db: Session = Depends(get_db)

):

    return generate_decision(
        db,
        request.project
    )