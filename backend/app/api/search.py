from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Body, Depends
import datetime
from app.database.postgres import get_db

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def format_accurate_timestamp(dt: Optional[datetime.datetime]) -> str:
    if not dt:
        dt = datetime.datetime.now(datetime.timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(IST).strftime("%Y-%m-%d %H:%M")
from app.schemas.search_schema import SearchRequest, SearchResponse
from app.services.search_agent import (
    execute_enterprise_search,
    register_document_click,
    get_search_analytics_report,
    check_duplicate_document
)

router = APIRouter(
    prefix="/search",
    tags=["Search Agent"]
)


@router.post("/", response_model=SearchResponse)
def search_raw_enterprise_data(request: SearchRequest):
    """
    State-of-the-Art Search Agent Endpoint (Agent 2 - Searches Raw Enterprise Data)
    Implements all 20 Advanced Features:
    - Hybrid Search (Semantic + BM25 Keyword)
    - Source Ranking (Freshness + Department Priority + Importance + Adaptive Clicks)
    - Multi-Document Retrieval & Category Scoping
    - Department-Aware RBAC Scoping
    - Personal Memory Search
    - Cross-Document Linking & Graph Relationships
    - Query Rewriting & Task Planner
    - Multi-Step Agentic RAG Iterative Search
    - Clarification Agent
    - Citations & Attribution Generator
    - Explainability Engine & Confidence Scoring
    - Knowledge Gap Detection & Analytics Logging
    - Federated Multi-Store Search
    """
    try:
        from app.database.postgres import SessionLocal
        from app.models.search_history import SearchHistory

        response = execute_enterprise_search(
            query=request.query,
            file_type=request.file_type,
            department=request.department,
            user_role=request.user_role,
            user_id=request.user_id,
            top_k=request.top_k,
            search_mode=request.search_mode,
            enable_query_rewriting=request.enable_query_rewriting,
            enable_agentic_rag=request.enable_agentic_rag,
            enable_personal_memory=request.enable_personal_memory,
            document_category=request.document_category
        )

        # Log search query to PostgreSQL database if requested
        if request.record_history:
            try:
                with SessionLocal() as db:
                    rec = SearchHistory(
                        user_id=request.user_id or "emp_101",
                        query=request.query,
                        results_found=len(response.results) if response.results else 0,
                        department=request.department or "General",
                        search_mode=request.search_mode or "Hybrid"
                    )
                    db.add(rec)
                    db.commit()
            except Exception as log_err:
                print(f"Search history log notice: {log_err}")

        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Enterprise Search Agent Error: {str(e)}"
        )


@router.get("/", response_model=SearchResponse)
def search_raw_enterprise_data_get(
    query: str = Query(..., description="Search query string"),
    file_type: Optional[str] = Query(None, description="File extension filter (pdf, docx, ppt, txt)"),
    department: Optional[str] = Query(None, description="Department context (hr, finance, engineering)"),
    user_role: str = Query("user", description="User RBAC role (admin, hr_manager, finance_analyst, user)"),
    user_id: str = Query("default_user", description="Active user ID for personal memory search"),
    top_k: int = Query(5, ge=1, le=50, description="Top-K result limit"),
    search_mode: str = Query("hybrid", description="Search strategy: hybrid, semantic, keyword, federated")
):
    """GET endpoint for Enterprise Search Agent."""
    try:
        response = execute_enterprise_search(
            query=query,
            file_type=file_type,
            department=department,
            user_role=user_role,
            user_id=user_id,
            top_k=top_k,
            search_mode=search_mode
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Enterprise Search Agent Error: {str(e)}"
        )


@router.post("/click")
def record_click_feedback(file_name: str = Body(..., embed=True)):
    """
    Adaptive Search Learning Endpoint:
    Registers user click on a document to dynamically boost relevance score in future queries.
    """
    register_document_click(file_name)
    return {
        "success": True,
        "file_name": file_name,
        "message": f"Adaptive search weight updated for '{file_name}'."
    }


@router.get("/analytics")
def get_search_analytics():
    """
    Admin Dashboard Search Analytics & Knowledge Gap Endpoint:
    Returns query counts, search latency, popular topics, and unanswered knowledge gaps.
    """
    report = get_search_analytics_report()
    return {
        "success": True,
        "analytics": report
    }


@router.get("/history")
def get_search_history(
    limit: int = 500,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Employer/Employee Search Query History Endpoint:
    Returns timestamped history of executed search queries from PostgreSQL, scoped by user_id if supplied.
    """
    try:
        from app.models.search_history import SearchHistory
        q = db.query(SearchHistory)
        if user_id:
            q = q.filter(SearchHistory.user_id == user_id)

        total_count = q.count()
        records = q.order_by(SearchHistory.search_time.desc()).limit(limit).all()
        history = []
        for r in records:
            ts = format_accurate_timestamp(r.search_time) if r.search_time else "Just now"
            history.append({
                "id": r.id,
                "user_id": r.user_id or "emp_101",
                "query": r.query,
                "timestamp": ts,
                "results_found": r.results_found or 0,
                "department": r.department or "General",
                "search_mode": r.search_mode or "Semantic Vector Search"
            })
        return {"success": True, "history": history, "total_count": total_count}
    except Exception as e:
        print(f"Error fetching search history: {e}")
        return {"success": False, "history": []}


@router.delete("/history/clear")
def clear_search_history(
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Wipes search query history records from PostgreSQL, scoped by user_id if supplied."""
    try:
        from app.models.search_history import SearchHistory
        q = db.query(SearchHistory)
        if user_id:
            q = q.filter(SearchHistory.user_id == user_id)
        q.delete()
        db.commit()
        return {"success": True, "message": "Search history cleared."}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": str(e)}


@router.delete("/history/{history_id}")
def delete_search_history_item(history_id: int, db: Session = Depends(get_db)):
    """Deletes a single search query history record by ID from PostgreSQL."""
    try:
        from app.models.search_history import SearchHistory
        item = db.query(SearchHistory).filter(SearchHistory.id == history_id).first()
        if item:
            db.delete(item)
            db.commit()
            return {"success": True, "message": f"Search history item {history_id} deleted."}
        return {"success": False, "message": "History item not found."}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": str(e)}



@router.post("/duplicate-check")
def check_duplicate(filename: str = Body(...), content: str = Body(...)):
    """
    Duplicate Detection Endpoint:
    Verifies if document content already exists prior to indexing.
    """
    is_duplicate, message = check_duplicate_document(filename, content)
    return {
        "success": True,
        "is_duplicate": is_duplicate,
        "message": message or "Document content is unique."
    }


@router.get("/sources")
def get_supported_sources():
    """List raw enterprise data sources, storage locations, and federated system connectors."""
    return {
        "success": True,
        "raw_data_sources": [
            {"type": "PDF Files", "extension": ".pdf", "status": "active"},
            {"type": "DOCX Files", "extension": ".docx", "status": "active"},
            {"type": "PPT Files", "extension": ".ppt", "status": "active"},
            {"type": "TXT Files", "extension": ".txt", "status": "active"},
            {"type": "Uploaded Files", "location": "uploads/", "status": "active"}
        ],
        "federated_connectors": [
            {"system": "ChromaDB Vector Store", "status": "active"},
            {"system": "PostgreSQL Enterprise Meta", "status": "active"},
            {"system": "SharePoint Connector", "status": "connector_ready"},
            {"system": "GitHub Enterprise", "status": "connector_ready"},
            {"system": "Google Drive", "status": "connector_ready"},
            {"system": "Confluence Wiki", "status": "connector_ready"}
        ]
    }
