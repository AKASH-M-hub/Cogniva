# Cogniva Enterprise AI Platform — Working Core Features Specification

**Document Version:** 1.0.0  
**Target Environment:** Local / Zero-Cost Cloud Deployment (Vercel, Render, Neon PostgreSQL)  
**System Status:** Production Ready (All 8 Core Modules Fully Functional)  

---

## Executive Summary & System Overview

**Cogniva** is an enterprise-grade, multi-agent Retrieval-Augmented Generation (RAG) and intelligence platform. It bridges unstructured enterprise knowledge silos with an autonomous network of specialized AI agents. 

### Core Tech Stack

- **Backend Framework:** FastAPI (Python 3.11) with Uvicorn ASGI Server
- **Frontend Stack:** React 18, Vite, Tailwind CSS / Vanilla CSS Design Tokens, Lucide Icons
- **Relational Database:** PostgreSQL (Neon.tech Cloud / Local Postgres) with SQLAlchemy ORM
- **Vector Database:** ChromaDB (Persistent local vector storage)
- **Embedding Model:** `all-MiniLM-L6-v2` via HuggingFace `sentence-transformers` (384-dimensional dense vectors)
- **Local LLM Engine:** Ollama running `Qwen 2.5 3B` (Quantized GGUF model for fast zero-cost local inference)
- **Automation & Scheduling:** Native FastAPI APScheduler + n8n Webhook Integration

---

## 1. Multi-Agent Orchestration Core (Cogniva Orchestrator)

The **Orchestration Agent** functions as the central dispatch brain of Cogniva, evaluating incoming user queries, determining intent, and orchestrating execution across downstream agents.

### Key Capabilities & Mechanics
- **Autonomous Intent Recognition:** Classifies incoming user queries into functional tasks (e.g., raw search, comparative decision analysis, deep synthesis, memory retrieval).
- **Dynamic Routing Engine:** Routes tasks to one or more specialized agents:
  - `Data Scout (Search Agent)` for raw information retrieval
  - `Insight Desk (Response Agent)` for synthesis and hallucination-checked responses
  - `Decision Engine` for trade-off matrix evaluation
  - `Memory Agent` for contextual history recall
  - `Analytics Agent` for operational telemetry queries
- **Multi-Step Execution Pipeline:** Supports both sequential handoffs (Search $\rightarrow$ Response) and parallel agent invocations.
- **Real-Time Execution Telemetry:** Tracks execution time per step, agent handoffs, confidence scores, and returns full execution logs to the UI.

### Active API Endpoints
- `POST /api/orchestrator/execute` — Submits user prompt for multi-agent orchestrated processing.
- `GET /api/orchestrator/status` — Checks current status and agent state.

---

## 2. Knowledge Hub (Document Ingestion, Chunking & Vector Persistence)

The **Knowledge Hub** manages the complete ingestion lifecycle of enterprise documents, transforming unstructured files into search-ready vector embeddings and indexed metadata.

### Key Capabilities & Mechanics
- **Multi-Format Document Extraction:** Supports parsing `.pdf` (via PyMuPDF), `.txt`, `.docx`, `.md`, `.csv`, and `.json`.
- **Intelligent Chunking Engine:** Splits document text into overlapping text chunks (configurable size, e.g., 500 characters with 100 character overlap) to preserve contextual integrity across chunk boundaries.
- **Dense Vector Embedding Pipeline:** Encodes each chunk into a 384-dimensional vector using `all-MiniLM-L6-v2`.
- **Dual-Persistence Storage:**
  - **PostgreSQL (`documents`, `document_chunks` tables):** Stores document metadata (filename, size, file type, upload timestamp, department tag) and chunk text content.
  - **ChromaDB (`cogniva_knowledge_base` collection):** Stores vector embeddings alongside chunk IDs and metadata for fast approximate nearest neighbor (ANN) search.
- **Pre-Indexing Duplicate Check:** Verifies document content hash against PostgreSQL before processing to avoid redundant embeddings.
- **Vector Store Inspector UI:** Provides interactive frontend table to browse active vector chunks, filter by document, and delete individual vector records.

### Active API Endpoints
- `POST /upload/` — Uploads and processes new enterprise documents.
- `GET /upload/documents` — Fetches list of indexed documents and status.
- `DELETE /upload/documents/{doc_id}` — Deletes document from PostgreSQL and vector embeddings from ChromaDB.
- `POST /search/duplicate-check` — Validates document uniqueness.

---

## 3. Data Scout (Search Agent — Intelligent Federated RAG)

The **Data Scout** is an advanced retrieval engine engineered to locate relevant knowledge across structured database tables and vector indexes.

### Key Capabilities & Mechanics
- **Query Rewriter Engine:** Automatically expands input search queries with domain entities, context tags, and synonym variations to improve recall.
- **Federated Multi-Store Retrieval:** Executes concurrent queries against ChromaDB vector store and PostgreSQL document tables.
- **Hybrid Ranking (RRF & Cross-Encoder):** Combines Reciprocal Rank Fusion (RRF) scoring for vector similarity with BM25 keyword matching to order search results by relevance.
- **Department-Aware RBAC Scoping:** Filters search results based on the requesting user's department (`Engineering`, `HR`, `Finance`, `Legal`) and permission level.
- **Cross-Document Graph Linker:** Discovers semantic relationships between chunks from different files and dynamically generates cross-references.
- **Adaptive Search Learning:** Learns from user interactions by recording clicked search results (`/search/click`) to dynamically boost document relevance in future queries.

### Active API Endpoints
- `POST /search/` — Post-based enterprise hybrid search with custom filters.
- `GET /search/` — Get-based enterprise search.
- `POST /search/click` — Registers user click feedback to update adaptive relevance weights.
- `GET /search/sources` — Lists active data connectors and supported file types.
- `GET /search/history` — Retrieves timestamped user query history from PostgreSQL.
- `DELETE /search/history/clear` — Wipes user search history.

---

## 4. Insight Desk (Response Agent — Verified RAG & Guardrails)

The **Insight Desk** synthesizes retrieved document context into precise, professional answers backed by strict quality guardrails and hallucination checks.

### Key Capabilities & Mechanics
- **Context-Aware System Prompts:** Assembles structured system prompts incorporating retrieved chunk snippets, conversation history, and formatting instructions.
- **Hallucination Validator:** Verifies every claim in the generated response against retrieved source snippets to ensure strict zero-hallucination fidelity.
- **Contradiction Detector:** Detects conflicting statements across multiple document sources (e.g., conflicting policy dates or financial metrics) and alerts the user.
- **PII Scrubbing & Compliance Guard:** Filters out sensitive personally identifiable information (SSNs, credit card numbers, confidential emails) prior to rendering final output.
- **Interactive Markdown Citations:** Embeds interactive, numbered source citations `[1]`, `[2]` linked to document metadata, chunk text, and confidence scores.

### Active API Endpoints
- `POST /chat/` — Sends chat message for RAG synthesis and guardrail verification.
- `GET /chat/history` — Retrieves chat conversation logs.
- `DELETE /chat/history/clear` — Clears user chat session history.

---

## 5. Decision Engine (Multi-Criteria Analysis & Risk Matrix Agent)

The **Decision Engine** provides strategic decision support by executing multi-criteria decision analysis (MCDA) on enterprise data.

### Key Capabilities & Mechanics
- **Multi-Criteria Decision Analysis (MCDA):** Evaluates competing choices or project strategies across weighted criteria (Cost, Feasibility, Timeline, Risk, Impact, ROI).
- **Trade-Off Matrix Generation:** Produces structured comparative tables comparing Option A vs. Option B based on evidence extracted from indexed documents.
- **Risk Assessment & Mitigation Matrix:** Identifies operational risks, assigns severity/probability scores, and suggests actionable mitigation steps.
- **Structured JSON & Markdown Reports:** Formats decision outputs with executive summaries, pros/cons lists, risk tables, and final recommendations.

### Active API Endpoints
- `POST /api/decision/evaluate` — Submits decision parameters and criteria for evaluation.
- `GET /api/decision/history` — Fetches past decision evaluation reports.

---

## 6. Memory Agent (Multi-Tier Personal & Enterprise Knowledge Store)

The **Memory Agent** manages contextual state across sessions, allowing Cogniva to maintain continuity and recall past interactions.

### Key Capabilities & Mechanics
- **4-Tier Memory Architecture:**
  1. **Short-Term Memory:** Active session context and query conversation buffer.
  2. **Long-Term Memory:** Persistent history stored in PostgreSQL (`search_history`, `response_history`, `memory_records`).
  3. **Semantic Memory:** Extracted entity-relationship store holding domain concepts and key organization facts.
  4. **Epistemic Memory:** System belief store tracking model confidence and knowledge stability over time.
- **Cross-Session Recall:** Injects relevant past interactions into active agent prompts to personalize search and chat results.
- **Memory Maintenance:** Features automated memory pruning and consolidation to clean stale context.

### Active API Endpoints
- `POST /api/memory/store` — Stores explicit memory record or user preference.
- `GET /api/memory/search` — Searches stored memory entries by key/topic.
- `GET /api/memory/status` — Returns memory usage metrics across short-term, long-term, semantic, and epistemic tiers.

---

## 7. Analytics Workspace & Automated Workflows

The **Analytics Workspace** offers real-time visibility into system health, search performance, and knowledge base coverage.

### Key Capabilities & Mechanics
- **Real-Time Operational Dashboard:** Displays total queries executed, average response latency (ms), document indexing volume, agent delegation breakdown, and search mode distribution.
- **Knowledge Gap Detection:** Automatically identifies search queries that yielded zero matches or low confidence scores (<0.65), flagging missing enterprise knowledge.
- **Native FastAPI APScheduler:**
  - Runs in-process background jobs without external service fees.
  - Monitors unmatched query thresholds (triggers alert on $\ge 5$ unmatched queries).
  - Prepares scheduled weekly analytics summaries every Monday at 9:00 AM.
- **n8n Automation Connector:** Formats alert payloads for external webhooks (email digests, Slack notifications, Jira ticket creation).

### Active API Endpoints
- `GET /api/analytics-agent/dashboard` — Returns complete telemetry and performance metrics.
- `GET /api/analytics-agent/knowledge-gaps` — Returns list of identified unanswered user queries.
- `GET /search/analytics` — Admin search analytics summary report.

---

## 8. Enterprise Authentication, RBAC & Database Architecture

Cogniva enforces enterprise data protection, user authorization, and structural database integrity.

### Authentication & Role-Based Access Control (RBAC) Mechanics
- **User Authentication (`/auth/login`, `/auth/register`):** Validates enterprise credentials using `bcrypt` password hashing (`app/utils/security.py`).
- **Agent Endpoint Scoping:** Core agent APIs (`/search`, `/chat`, `/upload`, `/orchestrator`) scope permissions via **Direct User Context & Department Parameters** (`user_role`, `department`, `user_id`) to ensure seamless inter-agent task delegation.
- **Role Scoping (`Admin`, `Analyst`, `Viewer`):** Restricts document retrieval and knowledge hub access by matching request department and role metadata against document tags in PostgreSQL.

### Active Database Schema (PostgreSQL — 17 Active Tables)
1. `users` — Enterprise user accounts, bcrypt password hashes, roles (`Admin`, `Analyst`, `Viewer`), department.
2. `documents` — Metadata for all ingested enterprise files in Knowledge Hub.
3. `document_chunks` — Text chunks with positional offsets, token counts, and ChromaDB vector mapping.
4. `search_history` — Logs of user search queries, department context, execution latency, and similarity scores.
5. `response_history` — Audit log of generated RAG answers, groundedness status, latency, and confidence scores.
6. `orchestration_logs` — Execution traces for multi-agent workflows handled by Cogniva Orchestrator.
7. `orchestration_analytics` — System-wide agent utilization metrics and task throughput.
8. `decision_logs` — Multi-criteria decision analysis (MCDA) runs, trade-off matrix data, and recommendations.
9. `decision_analytics_summary` — Aggregated metrics for decision-making speed and search success rate.
10. `conversation_memory` — Turn-by-turn chat history buffer with importance scoring for session context.
11. `user_preferences` — Personal user profiles, output language preferences, and favorite document bookmarks.
12. `enterprise_decisions` — Knowledge base of organization-wide policy decisions, priority tags, and owner info.
13. `pinned_memories` — User-pinned context snippets for persistent system prompt injection.
14. `recent_context` — Low-latency cache storing active session context summaries.
15. `memory_analytics` — Performance tracking for Memory Agent operations.
16. `analytics_agent_logs` — System event logger for operational performance tracking.
17. `knowledge_gaps` — Identified unanswered queries tracking missing coverage for n8n/APScheduler alerts.

---

## Summary Matrix of Working Features

| Feature Module | Primary Function | Primary Technologies | Main Endpoint |
| :--- | :--- | :--- | :--- |
| **Cogniva Orchestrator** | Intelligent Request Routing & Execution | FastAPI, Python | `POST /api/orchestrator/execute` |
| **Knowledge Hub** | Multi-Format Ingestion & Vector Indexing | PyMuPDF, SentenceTransformers, ChromaDB | `POST /upload/` |
| **Data Scout** | Federated Hybrid RAG Search Engine | RRF Ranking, BM25, RBAC Filters | `POST /search/` |
| **Insight Desk** | Guardrailed Answer Generation | Ollama (Qwen 2.5 3B), PII Scrubbing | `POST /chat/` |
| **Decision Engine** | Trade-Off & Risk Matrix Analysis | MCDA Framework, Python | `POST /api/decision/evaluate` |
| **Memory Agent** | Multi-Tier Context Memory | PostgreSQL, ChromaDB, Vector Recycler | `POST /api/memory/store` |
| **Analytics Workspace** | Telemetry & Knowledge Gap Tracker | APScheduler, n8n, Chart.js / Recharts | `GET /api/analytics-agent/dashboard` |
| **Auth & Security** | RBAC, Password Hashing & Department Scoping | Bcrypt, User Context Params, PostgreSQL | `POST /auth/login` |
