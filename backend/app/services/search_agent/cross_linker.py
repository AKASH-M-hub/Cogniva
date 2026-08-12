from typing import List, Dict, Any, Tuple
from app.schemas.search_schema import LinkedDocument, CitationDetails

CROSS_LINK_GRAPH = {
    "hr policy.pdf": [
        {"file_name": "Leave Rules.pdf", "file_type": "pdf", "rel": "Referenced Leave Regulations", "relevance": 0.94, "snippet": "Detailed guidelines on leave application workflows and accruals."},
        {"file_name": "Vacation SOP.pdf", "file_type": "pdf", "rel": "Standard Operating Procedure", "relevance": 0.91, "snippet": "SOP for vacation approval chain and manager sign-off."}
    ],
    "leave rules.pdf": [
        {"file_name": "Vacation SOP.pdf", "file_type": "pdf", "rel": "Associated SOP", "relevance": 0.93, "snippet": "Step-by-step vacation scheduling procedure."}
    ],
    "cogniva_srs.pdf": [
        {"file_name": "API Contracts.pdf", "file_type": "pdf", "rel": "API Technical Specification", "relevance": 0.96, "snippet": "REST API contracts for endpoints defined in SRS section 3."},
        {"file_name": "Memory Lifecycle.pdf", "file_type": "pdf", "rel": "Architecture Memory Blueprint", "relevance": 0.92, "snippet": "Memory lifecycle specification for short-term and long-term agent memory."}
    ],
    "api contracts.pdf": [
        {"file_name": "Cogniva_SRS.pdf", "file_type": "pdf", "rel": "Parent System Requirements", "relevance": 0.95, "snippet": "Core SRS requirements governing API data contracts."}
    ]
}


def find_linked_documents(filename: str) -> List[LinkedDocument]:
    fn_lower = filename.lower()
    linked_docs = []

    if fn_lower in CROSS_LINK_GRAPH:
        for item in CROSS_LINK_GRAPH[fn_lower]:
            linked_docs.append(
                LinkedDocument(
                    file_name=item["file_name"],
                    file_type=item["file_type"],
                    relationship_type=item["rel"],
                    relevance_score=item["relevance"],
                    snippet=item["snippet"]
                )
            )

    return linked_docs


def generate_citation(filename: str, chunk_index: int = 1, score: float = 0.90) -> CitationDetails:
    page_num = max(1, (chunk_index or 1) + 1)
    citation_str = f"According to {filename} (Page {page_num}, Chunk #{chunk_index or 1})"
    
    return CitationDetails(
        citation_text=citation_str,
        document_title=filename,
        chunk_index=chunk_index,
        confidence_percentage=round(score * 100, 1)
    )
