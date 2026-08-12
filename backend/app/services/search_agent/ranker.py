import time
from typing import List, Dict, Any, Optional

DOCUMENT_CLICK_REGISTRY: Dict[str, int] = {
    "Cogniva_SRS.pdf": 15,
    "API Contracts.pdf": 12,
    "Memory Lifecycle.pdf": 8,
    "HR Policy.pdf": 10
}


def calculate_freshness_score(metadata: Dict[str, Any]) -> float:
    created_at = metadata.get("created_at") or metadata.get("timestamp")
    if not created_at:
        return 0.7

    current_time = time.time()
    age_seconds = max(0, current_time - float(created_at))
    days_old = age_seconds / 86400.0

    if days_old <= 30:
        return 1.0
    elif days_old <= 90:
        return 0.85
    elif days_old <= 365:
        return 0.70
    return 0.50


def calculate_importance_score(filename: str, category: str) -> float:
    fn_lower = filename.lower()
    cat_lower = category.lower()

    if "srs" in fn_lower or "policy" in fn_lower or cat_lower == "policy":
        return 1.0
    elif "architecture" in fn_lower or "contract" in fn_lower or cat_lower == "sop":
        return 0.9
    elif "manual" in fn_lower or cat_lower == "manual":
        return 0.8
    elif "report" in fn_lower or cat_lower == "report":
        return 0.7
    return 0.6


def apply_source_ranking(
    hits: List[Dict[str, Any]],
    user_department: Optional[str] = None
) -> List[Dict[str, Any]]:
    ranked_hits = []
    user_dept = (user_department or "general").lower()

    for hit in hits:
        filename = hit.get("file_name", "unknown")
        meta = hit.get("metadata", {})
        category = meta.get("category", "General")

        sim_score = hit.get("score", 0.5)
        freshness = calculate_freshness_score(meta)
        doc_dept = meta.get("department", "general").lower()
        dept_score = 1.0 if (doc_dept == user_dept or user_dept == "admin") else 0.75
        importance = calculate_importance_score(filename, category)

        click_count = DOCUMENT_CLICK_REGISTRY.get(filename, 0)
        adaptive_boost = min(0.15, (click_count / 100.0))

        composite_score = (
            0.40 * sim_score +
            0.20 * freshness +
            0.15 * dept_score +
            0.15 * importance +
            0.10 * (1.0 if click_count > 5 else 0.5) +
            adaptive_boost
        )

        final_score = round(min(0.99, max(0.10, composite_score)), 4)
        confidence = "High" if final_score >= 0.75 else ("Medium" if final_score >= 0.50 else "Low")
        
        hit["composite_score"] = final_score
        hit["score"] = final_score
        hit["explainability"] = {
            "similarity_score": round(sim_score, 4),
            "freshness_score": round(freshness, 4),
            "department_relevance_score": round(dept_score, 4),
            "importance_score": round(importance, 4),
            "matched_keywords": meta.get("keywords", []),
            "match_reason": f"Matched via {hit.get('match_type', 'hybrid')} search with high multi-factor relevance boost.",
            "confidence_level": confidence
        }
        ranked_hits.append(hit)

    return sorted(ranked_hits, key=lambda x: x["composite_score"], reverse=True)


def register_document_click(filename: str):
    global DOCUMENT_CLICK_REGISTRY
    DOCUMENT_CLICK_REGISTRY[filename] = DOCUMENT_CLICK_REGISTRY.get(filename, 0) + 1
