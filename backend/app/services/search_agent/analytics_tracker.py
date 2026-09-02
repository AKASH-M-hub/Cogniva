import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple

SEARCH_ANALYTICS_LOG = {
    "total_queries": 0,
    "total_latency_ms": 0.0,
    "queries_history": [],
    "knowledge_gaps": [],
    "document_hashes": {}
}


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()


def check_duplicate_document(filename: str, content: str) -> Tuple[bool, Optional[str]]:
    content_hash = compute_content_hash(content)
    existing_file = SEARCH_ANALYTICS_LOG["document_hashes"].get(content_hash)

    if existing_file and existing_file != filename:
        return True, f"Duplicate detected: Document content matches '{existing_file}'."
    
    SEARCH_ANALYTICS_LOG["document_hashes"][content_hash] = filename
    return False, None


RECENT_GAPS_TRIGGERED = {}

def log_search_execution(
    query: str,
    results_count: int,
    latency_ms: float,
    user_department: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None
) -> bool:
    SEARCH_ANALYTICS_LOG["total_queries"] += 1
    SEARCH_ANALYTICS_LOG["total_latency_ms"] += latency_ms

    gap_logged = False
    if results_count == 0:
        gap_logged = True
        SEARCH_ANALYTICS_LOG["knowledge_gaps"].append({
            "query": query,
            "department": user_department or "general",
            "timestamp": time.time(),
            "status": "unanswered_missing_knowledge"
        })
        
        # Remove time limits per user's request.
        # To prevent the infinite loop, we simply ignore requests coming specifically from n8n.
        if user_id != "n8n_automation":
            def trigger_webhook():
                try:
                    import urllib.request
                    import json
                    req = urllib.request.Request(
                        'http://127.0.0.1:5678/webhook/knowledge-gap',
                        data=json.dumps({
                            'user_id': user_id or 'System',
                            'user_email': user_email or 'akashmohanraj333@gmail.com',
                            'query': query,
                            'department': user_department or 'General Enterprise'
                        }).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                    urllib.request.urlopen(req, timeout=5)
                except Exception as e:
                    print(f"[AnalyticsTracker] Webhook trigger failed: {e}")
            
            import threading
            threading.Thread(target=trigger_webhook, daemon=True).start()

    SEARCH_ANALYTICS_LOG["queries_history"].append({
        "query": query,
        "results_found": results_count,
        "latency_ms": latency_ms,
        "timestamp": time.time()
    })

    return gap_logged


def get_search_analytics_report() -> Dict[str, Any]:
    total = max(1, SEARCH_ANALYTICS_LOG["total_queries"])
    avg_latency = round(SEARCH_ANALYTICS_LOG["total_latency_ms"] / total, 2)

    return {
        "total_queries_executed": SEARCH_ANALYTICS_LOG["total_queries"],
        "average_latency_ms": avg_latency,
        "unanswered_knowledge_gaps_count": len(SEARCH_ANALYTICS_LOG["knowledge_gaps"]),
        "recent_knowledge_gaps": SEARCH_ANALYTICS_LOG["knowledge_gaps"][-10:],
        "popular_queries": [q["query"] for q in SEARCH_ANALYTICS_LOG["queries_history"][-5:]]
    }
