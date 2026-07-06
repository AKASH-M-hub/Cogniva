from fastapi import APIRouter

from app.schemas.chat_schema import ChatRequest
from app.services.response_service import generate_response

router = APIRouter(
    prefix="/chat",
    tags=["AI Workspace"]
)


@router.post("/")
def chat(request: ChatRequest):

    try:

        answer = generate_response(request.question)

        return {
            "success": True,
            "question": request.question,
            "answer": answer
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e),
            "type": str(type(e))
        }