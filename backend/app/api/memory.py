from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.schemas.memory_schema import MemoryCreate

from app.services.memory_service import (
    create_memory,
    get_all_memories
)

router = APIRouter(
    prefix="/memory",
    tags=["Memory Vault"]
)


@router.post("/add")
def add_memory(

    memory: MemoryCreate,

    db: Session = Depends(get_db)

):

    return create_memory(
        db,
        memory
    )


@router.get("/all")
def all_memories(

    db: Session = Depends(get_db)

):

    return get_all_memories(db)