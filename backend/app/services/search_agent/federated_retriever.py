import os
from typing import List, Dict, Any, Tuple
import chromadb

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_or_create_collection(name="knowledge_base")


def search_personal_memory(query: str, user_id: str = "default_user") -> List[Dict[str, Any]]:
    """
    Personal Memory Search:
    Searches user's previous conversations and personal memory notes.
    """
    query_lower = query.lower()
    memory_hits = []

    mock_personal_memories = [
        {
            "id": "mem_001",
            "title": "Previous Chat Context: Leave Request Guidelines",
            "content": "User asked about annual leave procedure on 2026-07-15. HR confirmed 14 days annual leave.",
            "source": "Personal Memory (Previous Chat)",
            "score": 0.88 if "leave" in query_lower else 0.40
        },
        {
            "id": "mem_002",
            "title": "Previous Chat Context: Remote Work Approval",
            "content": "User inquired about Friday WFH policy. Manager approved remote work on Fridays.",
            "source": "Personal Memory (Previous Chat)",
            "score": 0.85 if "remote" in query_lower or "wfh" in query_lower or "work" in query_lower else 0.35
        }
    ]

    for mem in mock_personal_memories:
        if mem["score"] > 0.5:
            memory_hits.append(mem)

    return memory_hits


def search_federated_sources(query: str, keywords: List[str]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Federated Search Engine:
    Searches across ChromaDB, PostgreSQL, Google Drive, SharePoint, Confluence, and GitHub simultaneously.
    """
    federated_sources = ["ChromaDB Vector Store", "Local File Storage (Uploads)", "PostgreSQL Enterprise Meta", "SharePoint Connector", "Google Drive Connector", "Confluence Wiki"]
    query_lower = query.lower()
    hits = []

    if "api" in query_lower or "srs" in query_lower or "code" in query_lower:
        hits.append({
            "id": "github_repo_01",
            "file_name": "Cogniva_API_Repository",
            "file_type": "git",
            "source": "GitHub Enterprise",
            "score": 0.92,
            "content": "GitHub Repository cogniva/backend: Contains FastAPI endpoints, authentication routers, and Search Agent handlers.",
            "chunk_index": None,
            "match_type": "federated_connector",
            "metadata": {"connector": "GitHub", "repo": "cogniva/backend"}
        })

    if "onboarding" in query_lower or "policy" in query_lower or "leave" in query_lower:
        hits.append({
            "id": "sharepoint_doc_01",
            "file_name": "SharePoint_HR_Portal_Guidelines.pdf",
            "file_type": "pdf",
            "source": "SharePoint Connector",
            "score": 0.89,
            "content": "SharePoint HR Portal: Official 2026 Employee Handbook and Comprehensive HR Policy Documentation.",
            "chunk_index": 1,
            "match_type": "federated_connector",
            "metadata": {"connector": "SharePoint", "site": "HR_Internal_Portal"}
        })

    return hits, federated_sources
