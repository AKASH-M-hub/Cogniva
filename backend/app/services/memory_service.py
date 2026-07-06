from sqlalchemy.orm import Session

from app.models.memory import Memory

from app.schemas.memory_schema import MemoryCreate


def create_memory(
    db: Session,
    memory: MemoryCreate
):

    new_memory = Memory(

        department=memory.department,

        title=memory.title,

        decision=memory.decision,

        reason=memory.reason,

        priority=memory.priority

    )

    db.add(new_memory)

    db.commit()

    db.refresh(new_memory)

    return {

        "success": True,

        "message": "Memory Saved Successfully"

    }


def get_all_memories(db: Session):

    return db.query(Memory).all()