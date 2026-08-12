from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., description="Raw search query from user or orchestrator")
    file_type: Optional[str] = Field(None, description="Filter by file type/extension (e.g. pdf, docx, ppt, txt)")
    department: Optional[str] = Field(None, description="User or target department (hr, finance, engineering, admin)")
    user_role: Optional[str] = Field("user", description="User RBAC role (admin, hr_manager, finance_analyst, user)")
    user_id: Optional[str] = Field("default_user", description="ID of active user for personal memory search")
    top_k: int = Field(5, ge=1, le=50, description="Number of top results to return")
    search_mode: str = Field("hybrid", description="Search strategy: hybrid, semantic, keyword, federated")
    enable_query_rewriting: bool = Field(True, description="Enable LLM/rule query expansion and rewriting")
    enable_agentic_rag: bool = Field(True, description="Enable multi-step iterative search evaluation")
    enable_personal_memory: bool = Field(True, description="Search user personal memory/chat history first")
    record_history: bool = Field(True, description="Record search to query history table")
    document_category: Optional[str] = Field(None, description="Category filter (Policy, SOP, Meeting Notes, Report)")


class LinkedDocument(BaseModel):
    file_name: str
    file_type: str
    relationship_type: str = Field(..., description="e.g. Related Policy, Supplemental SOP, Referenced Document")
    relevance_score: float
    snippet: str


class CitationDetails(BaseModel):
    citation_text: str = Field(..., description="Formated citation e.g. According to HR Policy.pdf Page 2 Chunk #1")
    document_title: str
    chunk_index: Optional[int] = None
    confidence_percentage: float


class ExplainabilityDetails(BaseModel):
    similarity_score: float
    freshness_score: float
    department_relevance_score: float
    importance_score: float
    matched_keywords: List[str]
    match_reason: str
    confidence_level: str = Field(..., description="High, Medium, Low")


class DocumentResult(BaseModel):
    file_name: str
    file_type: str
    source: str = Field(..., description="e.g. ChromaDB, PostgreSQL, FileStorage, SharePoint, GitHub")
    category: str = Field("General", description="Document Category: Policy, SOP, Meeting Notes, Report, Manual")
    score: float = Field(..., description="Composite Enterprise Score (0.0 to 1.0)")
    content: str
    chunk_index: Optional[int] = None
    match_type: str = Field(..., description="semantic, keyword, metadata, hybrid, graph")
    citation: CitationDetails
    explainability: ExplainabilityDetails
    linked_documents: List[LinkedDocument] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ClarificationOption(BaseModel):
    needs_clarification: bool = False
    clarification_prompt: Optional[str] = None
    suggested_options: List[str] = Field(default_factory=list)


class TaskPlanStep(BaseModel):
    task_id: int
    task_description: str
    sub_query: str
    status: str = "completed"
    results_found: int = 0


class SearchPlan(BaseModel):
    intent: str
    original_query: str
    rewritten_query: str
    extracted_keywords: List[str]
    applied_filters: Dict[str, Any]
    active_engines: List[str]
    task_decomposition: List[TaskPlanStep] = Field(default_factory=list)
    agentic_iterations: int = 1


class AnalyticsSummary(BaseModel):
    query_count: int
    search_latency_ms: float
    top_matched_sources: List[str]
    knowledge_gap_detected: bool = False


class SearchResponse(BaseModel):
    success: bool
    query: str
    rewritten_query: str
    search_plan: SearchPlan
    clarification: ClarificationOption
    filters: Dict[str, Any]
    total_results: int
    top_k: int
    results: List[DocumentResult]
    personal_memory_results: List[Dict[str, Any]] = Field(default_factory=list)
    federated_sources_searched: List[str] = Field(default_factory=list)
    knowledge_gap_logged: bool = False
    analytics: AnalyticsSummary
    message: str = "Enterprise Agentic Search Completed (High-Level Multi-Engine Retrieval)"
