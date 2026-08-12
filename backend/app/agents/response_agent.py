from typing import Optional
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.response_agent import execute_response_agent_pipeline, generate_response


class EnterpriseResponseAgent:
    """
    Cogniva Agent 1 - Response Agent (Communicator & Synthesizer)
    Synthesizes information, formats responses, generates citations, validates statements,
    detects hallucinations, checks enterprise compliance, and adapts tone/language/persona.
    """

    def __init__(self, agent_name: str = "ResponseAgent"):
        self.name = agent_name
        self.role = "Enterprise Knowledge Synthesizer & Communicator"

    def respond(self, request: ChatRequest) -> ChatResponse:
        """Executes full 20-feature Enterprise Response Agent pipeline."""
        return execute_response_agent_pipeline(request)

    def simple_answer(self, question: str) -> str:
        """Helper returning plain natural language response string."""
        return generate_response(question)
