import re
from typing import List, Dict, Any, Tuple
from app.schemas.search_schema import ClarificationOption, TaskPlanStep


CLARIFICATION_MAP = {
    "leave": ["Annual Leave Policy", "Medical Leave Policy", "Maternity & Paternity Leave SOP", "Casual Leave Rules"],
    "pay": ["Payroll & Salary Structure", "Overtime Payment Policy", "Bonus & Incentive SOP"],
    "onboarding": ["Employee Onboarding Process", "IT Asset Provisioning SOP", "HR Welcome Guide"],
    "policy": ["HR Leave & Attendance Policy", "Remote Work Policy", "Information Security Policy"],
    "migration": ["Azure Cloud Migration Document", "Database Migration Plan", "Legacy System Offboarding"],
    "srs": ["Cogniva Enterprise SRS Document", "System Requirements Specification", "API Architecture SRS"]
}


def rewrite_query(query: str) -> str:
    """
    Query Rewriting Engine:
    Rewrites shorthand/ambiguous queries into high-precision technical search phrases.
    """
    clean_q = query.strip()
    lower_q = clean_q.lower()

    if lower_q == "what is onboarding":
        return "Explain employee onboarding process, HR guidelines, orientation SOP, and IT setup"
    elif "azure migration" in lower_q:
        return "Azure Cloud Infrastructure Migration plan, deployment steps, and architecture specs"
    elif "leave policy" in lower_q:
        return "Employee leave rules, annual leave quota, medical leave SOP, and holiday policy"
    elif "attendance policy" in lower_q:
        return "Employee work hours, time tracking, attendance rules, and remote work policy"
    elif "api contract" in lower_q or "api contracts" in lower_q:
        return "Enterprise REST API endpoint contracts, authentication specification, and JSON schemas"
    
    words = re.findall(r'\w+', clean_q)
    if len(words) <= 2:
        return f"{clean_q} enterprise policy specification document SOP overview"
    
    return clean_q


def detect_clarification_needed(query: str) -> ClarificationOption:
    """
    Clarification Agent:
    Detects single-word or vague queries and suggests specific topics.
    """
    lower_q = query.strip().lower()
    
    if lower_q in CLARIFICATION_MAP:
        options = CLARIFICATION_MAP[lower_q]
        return ClarificationOption(
            needs_clarification=True,
            clarification_prompt=f"Your search for '{query}' is broad. Did you mean one of the following?",
            suggested_options=options
        )
    
    return ClarificationOption(needs_clarification=False)


def generate_task_plan(query: str) -> List[TaskPlanStep]:
    """
    Search Planner:
    Decomposes multi-topic or comparative queries into step-by-step sub-tasks.
    """
    lower_q = query.lower()
    tasks = []

    if "compare" in lower_q or " vs " in lower_q or " and " in lower_q:
        parts = re.split(r'compare| vs | and ', lower_q)
        parts = [p.strip() for p in parts if p.strip() and len(p.strip()) > 2]
        
        if len(parts) >= 2:
            for idx, part in enumerate(parts, 1):
                tasks.append(
                    TaskPlanStep(
                        task_id=idx,
                        task_description=f"Search Enterprise Knowledge for '{part.title()}'",
                        sub_query=part,
                        status="completed"
                    )
                )
            tasks.append(
                TaskPlanStep(
                    task_id=len(tasks) + 1,
                    task_description="Synthesize comparative analysis across retrieved document sets",
                    sub_query=query,
                    status="completed"
                )
            )
            return tasks

    tasks.append(
        TaskPlanStep(
            task_id=1,
            task_description=f"Retrieve primary enterprise document context for '{query}'",
            sub_query=query,
            status="completed"
        )
    )
    return tasks
