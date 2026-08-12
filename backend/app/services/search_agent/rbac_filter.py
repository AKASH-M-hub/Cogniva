from typing import List, Dict, Any, Optional

ROLE_DEPARTMENT_ACCESS = {
    "admin": ["hr", "finance", "engineering", "legal", "executive", "general", "all"],
    "hr_manager": ["hr", "executive", "general"],
    "hr": ["hr", "general"],
    "finance_analyst": ["finance", "legal", "general"],
    "finance": ["finance", "general"],
    "engineering": ["engineering", "tech", "product", "general"],
    "user": ["general"]
}

DOCUMENT_DEPARTMENT_MAP = {
    "hr policy.pdf": "hr",
    "leave rules.pdf": "hr",
    "vacation sop.pdf": "hr",
    "onboarding.pdf": "hr",
    "cogniva_srs.pdf": "engineering",
    "api contracts.pdf": "engineering",
    "architecture.docx": "engineering",
    "memory lifecycle.pdf": "engineering",
    "financial_report_2025.pdf": "finance",
    "budget_allocation.xlsx": "finance",
    "legal_terms.pdf": "legal"
}


def filter_by_rbac(
    hits: List[Dict[str, Any]],
    user_role: Optional[str] = "user",
    user_department: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Department-Aware Search (RBAC + Search Agent):
    Filters raw retrieved documents according to user role and department scope.
    """
    role = (user_role or "user").lower()
    dept = (user_department or "general").lower()

    allowed_departments = set(ROLE_DEPARTMENT_ACCESS.get(role, ["general"]))
    allowed_departments.add(dept)
    allowed_departments.add("general")

    if "admin" in role or "all" in allowed_departments:
        return hits

    filtered_hits = []
    for hit in hits:
        filename = hit.get("file_name", "").lower()
        doc_dept = hit.get("metadata", {}).get("department") or DOCUMENT_DEPARTMENT_MAP.get(filename, "general")
        
        if doc_dept.lower() in allowed_departments or doc_dept == "general":
            hit["metadata"]["department"] = doc_dept
            filtered_hits.append(hit)

    return filtered_hits
