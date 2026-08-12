from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., description="User query or question")
    user_id: Optional[str] = Field("default_user", description="Active user ID for conversation memory")
    user_role: Optional[str] = Field("user", description="User role (employee, manager, hr, executive, developer)")
    department: Optional[str] = Field("general", description="User department")
    document_context: Optional[str] = Field(None, description="Active document title or context if selected")
    target_language: Optional[str] = Field("english", description="Response language (english, tamil, hindi, spanish, french, german)")
    target_persona: Optional[str] = Field("default", description="Audience persona (executive, developer, manager, intern, default)")
    tone: Optional[str] = Field("professional", description="Response tone (professional, technical, executive, friendly, concise)")
    summary_type: Optional[str] = Field(None, description="Optional summary mode (5-line, 1-page, executive)")
    enable_multi_agent: bool = Field(True, description="Enable multi-agent collaboration")
    enable_self_reflection: bool = Field(True, description="Enable agentic RAG self-reflection and hallucination check")


class CitationItem(BaseModel):
    source_document: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    confidence_percentage: float = 95.0
    snippet: str


class ResponseExplainability(BaseModel):
    selected_sources: List[str]
    reasoning_steps: List[str]
    confidence_score: float
    hallucination_check_passed: bool
    agent_collaboration: List[str]


class ResponseContradiction(BaseModel):
    conflict_detected: bool = False
    details: Optional[str] = None
    conflicting_sources: List[str] = Field(default_factory=list)


class ComplianceResult(BaseModel):
    compliant: bool = True
    masked_sensitive_terms_count: int = 0
    compliance_notes: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool = True
    question: str
    answer: Any = Field(..., description="Final natural language response string or formatted structure")
    raw_answer: Optional[str] = None
    citations: List[CitationItem] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    explainability: ResponseExplainability
    contradictions: ResponseContradiction
    compliance: ComplianceResult
    format_type: str = Field("markdown", description="markdown, table, executive_summary, bulleted_list")
    language: str = "english"
    knowledge_gap_logged: bool = False
    conversation_context_applied: bool = False
    message: str = "Enterprise Response Agent Execution Completed"