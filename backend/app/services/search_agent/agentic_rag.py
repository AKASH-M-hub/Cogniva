from typing import List, Dict, Any, Tuple
from app.services.search_agent.query_rewriter import rewrite_query


def evaluate_retrieval_completeness(query: str, hits: List[Dict[str, Any]]) -> float:
    if not hits:
        return 0.0

    query_words = set(w.lower() for w in query.split() if len(w) > 3)
    if not query_words:
        return 0.8

    found_words = set()
    for hit in hits:
        content_lower = hit.get("content", "").lower() + " " + hit.get("file_name", "").lower()
        for qw in query_words:
            if qw in content_lower:
                found_words.add(qw)

    coverage = len(found_words) / max(len(query_words), 1)
    max_score = max(h.get("score", 0.0) for h in hits)
    
    return round(0.5 * coverage + 0.5 * max_score, 4)


def run_agentic_rag_loop(
    query: str,
    base_search_fn,
    file_type: str = None,
    top_k: int = 5,
    user_department: str = None
) -> Tuple[List[Dict[str, Any]], int]:
    hits_iter1 = base_search_fn(query=query, file_type=file_type, top_k=top_k, department=user_department)
    completeness = evaluate_retrieval_completeness(query, hits_iter1)

    if completeness >= 0.70 or not hits_iter1:
        return hits_iter1, 1

    followup_query = rewrite_query(f"{query} details overview specification")
    hits_iter2 = base_search_fn(query=followup_query, file_type=file_type, top_k=top_k, department=user_department)

    seen_ids = set()
    merged_hits = []

    for hit in hits_iter1 + hits_iter2:
        hit_id = hit.get("id") or hit.get("file_name")
        if hit_id not in seen_ids:
            seen_ids.add(hit_id)
            merged_hits.append(hit)

    return merged_hits, 2
