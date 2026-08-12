from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DecisionEvaluationRequest(BaseModel):
    query: str
    search_results: Optional[List[Dict[str, Any]]] = None
    memory_context: Optional[Dict[str, Any]] = None
    department: Optional[str] = "Engineering & Product"
    user_role: Optional[str] = "employee"

class DecisionEvaluationResponse(BaseModel):
    query: str
    intent: str  # Explanation, Policy Check, Decision Support, Incident Analysis, Technical Architecture
    complexity: str  # Low, Medium, High, Critical
    department: str
    search_confidence_score: float
    enough_context: bool
    should_re_search: bool
    memory_consulted: bool
    multiple_docs_needed: bool
    retrieval_strategy: str
    recommendation: str
    reasons: List[str]
    confidence_score: float
    routing_target: str  # "Response Agent (Agent 1)"
    packaged_payload: Dict[str, Any]
    decision_latency_ms: float