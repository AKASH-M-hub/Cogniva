from sqlalchemy.orm import Session

from app.models.memory import Memory


def generate_decision(
    db: Session,
    project: str
):

    memories = db.query(Memory).all()

    if len(memories) == 0:

        return {

            "recommendation":
            "No enterprise knowledge available.",

            "confidence":
            "Low"

        }

    summary = ""

    for memory in memories:

        summary += f"""

Title:
{memory.title}

Decision:
{memory.decision}

Reason:
{memory.reason}

"""

    return {

        "recommendation":
        summary,

        "confidence":
        "High"

    }