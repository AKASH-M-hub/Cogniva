from fastapi import APIRouter, HTTPException
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.response_agent import execute_response_agent_pipeline

router = APIRouter(
    prefix="/chat",
    tags=["AI Workspace - Response Agent"]
)


@router.post("/", response_model=ChatResponse)
def chat_with_response_agent(request: ChatRequest):
    """
    State-of-the-Art Response Agent Endpoint (Agent 1 - Communicator & Synthesizer)
    Implements all 20 Advanced Features:
    - Response Validation & Grounding Verification
    - Citation Generator & Source Attribution
    - Response Formatter (Markdown Tables, Bulleted Lists, Executive Summaries)
    - Hallucination Detector & Agentic RAG Self-Reflection
    - Answer Simplifier & Persona Tailoring (Executive, Developer, Manager, Intern)
    - Follow-Up Generator (Contextual questions)
    - Multi-Document Reasoning Across Policies & SOPs
    - Contradiction & Conflict Detection Across Documents
    - Tone Adaptation & Multilingual Translation (Tamil, Hindi, Spanish, French, German)
    - Explainability & Reasoning Breakdown
    - Knowledge Gap Reporting & Analytics Logging
    - Smart Summarization (5-Line, Executive Summary)
    - Adaptive Prompt Engineering
    - Enterprise Compliance Checker & Sensitive Data Masker
    - Role-Based Personalization
    - Conversation Memory & Pronoun Resolution
    - Multi-Agent Collaboration
    """
    try:
        from app.database.postgres import SessionLocal
        from app.models.response_history import ResponseHistory
        from app.services.decision_service import evaluate_and_route
        from app.schemas.decision_schema import DecisionEvaluationRequest

        # Execute Decision Agent (Agent 4) Evaluation
        try:
            with SessionLocal() as db:
                evaluate_and_route(
                    db,
                    DecisionEvaluationRequest(
                        query=request.question,
                        department=request.department or "Engineering & Product",
                        user_role=request.user_role or "employee"
                    )
                )
        except Exception as dec_err:
            print(f"Decision Agent evaluation notice: {dec_err}")

        response = execute_response_agent_pipeline(request)

        # Log AI response & store into Agent 3 Memory Vault
        try:
            with SessionLocal() as db:
                rec = ResponseHistory(
                    user_id=request.user_id or "emp_101",
                    query=request.question,
                    response=response.answer,
                    model=response.llm_used or "Qwen 2.5 3B",
                    response_time=response.analytics.total_time_ms if response.analytics else 0.0,
                    confidence_score=response.confidence_score or 95.0,
                    grounded_status="100% Grounded" if response.is_grounded else "Unverified"
                )
                db.add(rec)

                # Store in Memory Agent (Agent 3) database
                from app.services.memory_agent_service import store_conversation_memory
                from app.schemas.memory_agent_schema import ConversationMemoryCreate
                store_conversation_memory(
                    db,
                    ConversationMemoryCreate(
                        query=request.question,
                        response=response.answer[:300],
                        summary=f"Query: {request.question[:60]} -> Answer: {response.answer[:80]}...",
                        session_id="session_live_agent3",
                        follow_up_references=response.follow_up_questions or []
                    ),
                    user_id=request.user_id or "default_user"
                )

                db.commit()
        except Exception as log_err:
            print(f"Response history log notice: {log_err}")

        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Response Agent Execution Error: {str(e)}"
        )