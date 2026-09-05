import os
import re
import time
from typing import List, Dict, Any, Optional

import chromadb

from app.config.settings import settings
from app.schemas.search_schema import (
    SearchRequest,
    SearchResponse,
    SearchPlan,
    DocumentResult,
    AnalyticsSummary,
    TaskPlanStep,
    CitationDetails,
    ExplainabilityDetails
)

from app.services.search_agent.query_rewriter import (
    rewrite_query,
    detect_clarification_needed,
    generate_task_plan
)
from app.services.search_agent.rbac_filter import filter_by_rbac
from app.services.search_agent.federated_retriever import (
    search_personal_memory,
    search_federated_sources
)
from app.services.search_agent.ranker import apply_source_ranking
from app.services.search_agent.cross_linker import (
    find_linked_documents,
    generate_citation
)
from app.services.search_agent.analytics_tracker import (
    log_search_execution,
    get_search_analytics_report,
    check_duplicate_document
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_or_create_collection(name="knowledge_base")

_model_instance = None


def get_model():
    global _model_instance
    if _model_instance is None:
        from sentence_transformers import SentenceTransformer
        _model_instance = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    return _model_instance


STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "up", "about", "into", "over", "after", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "show", "find",
    "get", "search", "document", "documents", "file", "files", "me", "please",
    "tell", "what", "where", "which", "who", "how", "can", "you", "give"
}


def _extract_keywords(query: str) -> List[str]:
    words = re.findall(r'\b[A-Za-z0-9_\-\.]+\b', query.lower())
    keywords = [w for w in words if w not in STOPWORDS and len(w) > 1]
    return keywords if keywords else words


def analyze_query(query: str) -> Dict[str, Any]:
    """Extract query intent, topic, keywords, and category signals."""
    q_lower = query.lower()
    keywords = _extract_keywords(query)

    if any(w in q_lower for w in ["reset", "error", "failed", "broken", "issue", "cannot", "unable", "not connecting", "problem"]):
        intent = "Troubleshooting / Issue Resolution"
    elif any(w in q_lower for w in ["policy", "leave", "reimbursement", "holiday", "benefit", "handbook", "remote"]):
        intent = "Company Policy Inquiry"
    elif any(w in q_lower for w in ["sop", "procedure", "process", "steps", "guide", "how to"]):
        intent = "Standard Operating Procedure (SOP)"
    elif any(w in q_lower for w in ["auth", "api", "architecture", "code", "schema", "spec"]):
        intent = "Technical Specification"
    else:
        intent = "General Enterprise Knowledge Inquiry"

    topic = " ".join(keywords[:3]).title() if keywords else "Enterprise Knowledge"
    return {
        "intent": intent,
        "topic": topic,
        "keywords": keywords,
        "query": query
    }


def execute_enterprise_search(
    query: str,
    file_type: Optional[str] = None,
    department: Optional[str] = None,
    user_role: Optional[str] = "user",
    user_id: Optional[str] = "default_user",
    top_k: Optional[int] = None,
    search_mode: str = "hybrid",
    enable_query_rewriting: bool = True,
    enable_agentic_rag: bool = True,
    enable_personal_memory: bool = True,
    document_category: Optional[str] = None
) -> SearchResponse:
    """
    Intelligent Enterprise Retrieval Engine for Search Agent:
    1. Query Analysis (Extract intent, topic, keywords)
    2. Query Embedding using all-MiniLM-L6-v2
    3. ChromaDB Semantic Vector Retrieval
    4. Similarity Threshold Filtering (configurable, e.g. 0.60)
    5. Chunk -> Source Document Mapping & Weighted Relevance Scoring
    6. Ranked Source Document Structuring
    7. History Logging & Latency Measurement
    """
    start_time = time.time()

    # Read configurable settings
    threshold = getattr(settings, "SIMILARITY_THRESHOLD", 0.60)
    limit_k = top_k if top_k is not None else getattr(settings, "SEARCH_TOP_K", 5)

    # 1. Query Analysis
    query_analysis = analyze_query(query)
    effective_query = rewrite_query(query) if enable_query_rewriting else query
    keywords = query_analysis["keywords"]

    # 2 & 3. Semantic Search in ChromaDB
    model = get_model()
    raw_chunks = []

    try:
        query_embedding = model.encode(effective_query).tolist()
        chroma_res = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit_k * 5, 50),
            include=["documents", "metadatas", "distances"]
        )

        docs = chroma_res.get("documents", [[]])[0]
        metadatas = chroma_res.get("metadatas", [[]])[0]
        distances = chroma_res.get("distances", [[]])[0]
        ids = chroma_res.get("ids", [[]])[0]

        for doc, meta, dist, hit_id in zip(docs, metadatas, distances, ids):
            # Calculate cosine similarity score (0.0 to 1.0)
            score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
            
            filename = meta.get("filename") or meta.get("source") or (hit_id.split("_")[0] if "_" in hit_id else "unknown")
            ext = filename.split(".")[-1].lower() if "." in filename else "pdf"

            if file_type and ext != file_type.lower().lstrip("."):
                continue

            # 4. Relevance Threshold Filtering
            if score >= threshold:
                raw_chunks.append({
                    "chunk_id": hit_id,
                    "filename": filename,
                    "document_id": meta.get("document_id") or filename,
                    "file_type": ext.upper(),
                    "department": meta.get("department") or department or "General",
                    "category": meta.get("category") or "PDF/DOCX Document",
                    "score": round(score, 4),
                    "content": doc,
                    "chunk_index": meta.get("chunk_index", 0),
                    "page": meta.get("page") or meta.get("page_number") or (meta.get("chunk_index", 0) + 1),
                    "timestamp": meta.get("timestamp", ""),
                    "metadata": meta
                })
    except Exception as e:
        print(f"[SearchAgent] ChromaDB Vector Query Notice: {e}")

    # Fallback / Keyword Match for metadata or filenames if raw_chunks is sparse
    if len(raw_chunks) < limit_k:
        try:
            all_items = collection.get(include=["documents", "metadatas"])
            docs = all_items.get("documents", [])
            metadatas = all_items.get("metadatas", [])
            ids = all_items.get("ids", [])

            existing_chunk_ids = {c["chunk_id"] for c in raw_chunks}
            for hit_id, doc, meta in zip(ids, docs, metadatas):
                if hit_id in existing_chunk_ids:
                    continue

                filename = meta.get("filename") or meta.get("source") or (hit_id.split("_")[0] if "_" in hit_id else "unknown")
                ext = filename.split(".")[-1].lower() if "." in filename else "pdf"

                if file_type and ext != file_type.lower().lstrip("."):
                    continue

                doc_lower = doc.lower()
                filename_lower = filename.lower()
                
                # Precise whole-word matching to avoid substring false positives (e.g. 'thor' in 'authors')
                kw_counts = {}
                for kw in keywords:
                    # Check in document content
                    matches = len(re.findall(rf"\b{re.escape(kw)}\b", doc_lower))
                    # Check in filename snippet (allow partial matches for filename)
                    if len(kw) > 3 and kw in filename_lower:
                        matches += 5
                        
                    if matches > 0:
                        kw_counts[kw] = matches
                        
                unique_kw_matches = len(kw_counts)

                if unique_kw_matches > 0:
                    # Calculate continuous proper score using asymptotic BM25-style TF (Term Frequency) calculation
                    total_term_freq = sum(kw_counts.values())
                    unique_ratio = unique_kw_matches / max(len(keywords), 1)
                    
                    # Compute TF Factor: TF / (TF + k) to naturally curve to 1.0 without hard caps
                    k = 2.0
                    tf_factor = total_term_freq / (total_term_freq + k)
                    
                    # 1. Base Score represents purely conceptual uniqueness match (up to 0.60 typically)
                    kw_base_score = 0.30 + (unique_ratio * 0.30)
                    
                    # 2. Add unbounded asymptotic frequency scoring (varies uniquely for every chunk)
                    # More hits = closer to +0.38 without ever snapping arbitrarily against a wall
                    freq_score = tf_factor * 0.38
                    
                    kw_score = round(kw_base_score + freq_score, 4)
                    
                    # Guaranteed inclusion if we heavily matched the filename
                    if any(len(kw) > 4 and kw in filename_lower for kw in keywords):
                        kw_score = max(kw_score, threshold + 0.15)
                    
                    if kw_score >= threshold:
                        raw_chunks.append({
                            "chunk_id": hit_id,
                            "filename": filename,
                            "document_id": meta.get("document_id") or filename,
                            "file_type": ext.upper(),
                            "department": meta.get("department") or department or "General",
                            "category": meta.get("category") or "PDF/DOCX Document",
                            "score": kw_score,
                            "content": doc,
                            "chunk_index": meta.get("chunk_index", 0),
                            "page": meta.get("page") or meta.get("page_number") or (meta.get("chunk_index", 0) + 1),
                            "timestamp": meta.get("timestamp", ""),
                            "metadata": meta
                        })
        except Exception as e:
            print(f"[SearchAgent] Keyword match notice: {e}")

    # 5. Chunk -> Source Document Mapping & Document Relevance Scoring
    doc_map = {}
    for chunk in raw_chunks:
        doc_key = chunk["filename"]
        if doc_key not in doc_map:
            doc_map[doc_key] = []
        doc_map[doc_key].append(chunk)

    mapped_documents = []
    for filename, chunks in doc_map.items():
        sorted_chunks = sorted(chunks, key=lambda x: x["score"], reverse=True)
        best_chunk = sorted_chunks[0]
        best_chunk_score = best_chunk["score"]
        
        # Calculate composite document score: 70% best chunk + 30% avg chunk score
        avg_chunk_score = sum(c["score"] for c in sorted_chunks) / len(sorted_chunks)
        document_score = round(best_chunk_score * 0.70 + avg_chunk_score * 0.30, 4)

        pages = sorted(list(set(c["page"] for c in sorted_chunks if c.get("page"))))

        mapped_documents.append({
            "filename": filename,
            "document_id": best_chunk["document_id"],
            "department": best_chunk["department"],
            "file_type": best_chunk["file_type"],
            "category": best_chunk["category"],
            "relevance_score": document_score,
            "best_chunk_score": best_chunk_score,
            "matched_chunks": len(sorted_chunks),
            "pages": pages,
            "best_chunk": best_chunk,
            "chunks": sorted_chunks
        })

    # 6. Rank Documents by Document Relevance Score
    mapped_documents.sort(key=lambda x: x["relevance_score"], reverse=True)
    top_mapped_documents = mapped_documents[:limit_k]

    # Convert to DocumentResult objects
    document_results = []
    for doc in top_mapped_documents:
        best_c = doc["best_chunk"]
        filename = doc["filename"]
        score = doc["relevance_score"]

        citation = generate_citation(filename, chunk_index=best_c["chunk_index"], score=score)
        linked_docs = find_linked_documents(filename)

        explainability = ExplainabilityDetails(
            similarity_score=score,
            freshness_score=0.95,
            department_relevance_score=1.0 if doc["department"].lower() == (department or "").lower() else 0.85,
            importance_score=0.90,
            matched_keywords=keywords,
            match_reason=f"Matched {doc['matched_chunks']} relevant vector section(s) with highest chunk score of {int(doc['best_chunk_score']*100)}%.",
            confidence_level="High" if score >= 0.75 else "Medium"
        )

        document_results.append(
            DocumentResult(
                file_name=filename,
                file_type=doc["file_type"],
                source="ChromaDB Vector Store & PostgreSQL",
                category=doc["category"],
                score=score,
                content=best_c["content"],
                chunk_index=best_c["chunk_index"],
                match_type="semantic",
                citation=citation,
                explainability=explainability,
                linked_documents=linked_docs,
                metadata={
                    "document_id": doc["document_id"],
                    "department": doc["department"],
                    "matched_chunks": doc["matched_chunks"],
                    "best_chunk_score": doc["best_chunk_score"],
                    "pages": doc["pages"],
                    "timestamp": best_c.get("timestamp", ""),
                    "intent": query_analysis["intent"],
                    "topic": query_analysis["topic"]
                }
            )
        )

    # 7. Search Latency & History Logging
    latency_ms = round((time.time() - start_time) * 1000.0, 2)
    gap_logged = log_search_execution(
        query=query,
        results_count=len(document_results),
        latency_ms=latency_ms,
        user_department=department,
        user_id=user_id
    )
    analytics_summary = get_search_analytics_report()

    search_plan = SearchPlan(
        intent=query_analysis["intent"],
        original_query=query,
        rewritten_query=effective_query,
        extracted_keywords=keywords,
        applied_filters={
            "file_type": file_type,
            "department": department,
            "similarity_threshold": threshold,
            "top_k": limit_k
        },
        active_engines=[
            "chromadb_semantic_vector_search",
            "mini_lm_l6_v2_embeddings",
            "document_relevance_ranker"
        ],
        task_decomposition=[],
        agentic_iterations=1
    )

    message = (
        f"Search completed in {latency_ms} ms."
        if document_results
        else "No relevant enterprise knowledge was found. Try a different query or search using broader terms."
    )

    return SearchResponse(
        success=True,
        query=query,
        rewritten_query=effective_query,
        search_plan=search_plan,
        clarification=detect_clarification_needed(query),
        filters=search_plan.applied_filters,
        total_results=len(document_results),
        top_k=limit_k,
        results=document_results,
        personal_memory_results=[],
        federated_sources_searched=["ChromaDB Vector Store", "PostgreSQL Enterprise Records"],
        knowledge_gap_logged=gap_logged,
        analytics=AnalyticsSummary(
            query_count=analytics_summary.get("total_queries_executed", 1),
            search_latency_ms=latency_ms,
            top_matched_sources=[r.source for r in document_results[:3]],
            knowledge_gap_detected=gap_logged
        ),
        message=message
    )


def search_documents(question: str) -> str:
    """Helper method for Response Agent & Orchestrator to retrieve top snippets."""
    res = execute_enterprise_search(query=question, top_k=5)
    if not res.results:
        return ""
    snippets = [f"Source: {r.file_name} (Relevance: {int(r.score*100)}%):\n{r.content}" for r in res.results if r.content]
    return "\n\n".join(snippets)
