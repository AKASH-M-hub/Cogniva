from typing import Optional, Dict, Any
from app.schemas.search_schema import SearchRequest, SearchResponse
from app.services.search_agent import execute_enterprise_search, search_documents


class EnterpriseSearchAgent:
    """
    Cogniva Agent 2 - Search Agent
    Searches Raw Enterprise Data (PDF, DOCX, PPT, TXT, Connectors).
    Does NOT search memory. Returns raw retrieved document objects with zero LLM reasoning.
    """

    def __init__(self, agent_name: str = "SearchAgent"):
        self.name = agent_name
        self.role = "Information Finder & Enterprise Knowledge Retrieval"

    def search(
        self,
        query: str,
        file_type: Optional[str] = None,
        department: Optional[str] = None,
        user_role: Optional[str] = "user",
        user_id: Optional[str] = "default_user",
        top_k: int = 5,
        search_mode: str = "hybrid"
    ) -> SearchResponse:
        """Executes full 20-feature Enterprise Search Agent pipeline."""
        return execute_enterprise_search(
            query=query,
            file_type=file_type,
            department=department,
            user_role=user_role,
            user_id=user_id,
            top_k=top_k,
            search_mode=search_mode
        )

    def retrieve_context_string(self, question: str) -> str:
        """Helper for AI Orchestrator / LLM Agent context injection."""
        return search_documents(question)
