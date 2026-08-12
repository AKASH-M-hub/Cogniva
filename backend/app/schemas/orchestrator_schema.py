from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class OrchestrationRequest(BaseModel):
    query: str = Field(..., description="The incoming employee query")
    department: Optional[str] = Field("Engineering & Product", description="User department")
    user_role: Optional[str] = Field("employee", description="User role")
    user_id: Optional[str] = Field("default_user", description="User identifier")
    session_id: Optional[str] = Field("session_orchestration", description="Session identifier")


class AgentExecutionStep(BaseModel):
    agent_id: str  # 'agent_2_search', 'agent_3_memory', 'agent_4_decision', 'agent_1_response'
    agent_name: str
    status: str  # 'Running', 'Completed', 'Idle'
    latency_ms: float
    summary: str
    output_data: Optional[Dict[str, Any]] = None


class OrchestrationPlan(BaseModel):
    intent: str
    complexity: str
    department: str
    need_search: bool
    need_memory: bool
    need_multiple_docs: bool
    agents_selected: List[str]
    routing_reasons: Dict[str, str]
    execution_steps: List[AgentExecutionStep]


class OrchestrationResponse(BaseModel):
    query: str
    plan: OrchestrationPlan
    aggregated_context: Dict[str, Any]
    packaged_payload: Dict[str, Any]
    planning_time_ms: float
    total_execution_time_ms: float
    success: bool
