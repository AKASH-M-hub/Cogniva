# Cogniva Master Chen ER Diagram Specification (19 Entities, 20 Relationships)

This master document contains the complete, 100% exhaustive, and error-free Entity-Relationship (ER) specification for the **Cogniva Enterprise AI Platform**. It covers all **17 PostgreSQL database tables** + **2 n8n Automation Entities** (19 Entities total) connected by **exactly 20 relationships**.

---

## 🏛️ 1. Complete Catalog of 19 Entities

### 📌 Group A: Core User & Preferences
1. **`USER`** `[Strong Entity]` — `_id_ (PK)`, `full_name`, `email (UQ)`, `employee_id`, `password`, `role`, `department`, `created_at`.
2. **`USER_PREFERENCE`** `[Entity]` — `_id_ (PK)`, `user_id (FK, UQ)`, `department`, `role`, `language`, `preferred_tone`, `((favorite_docs))`, `((frequently_accessed))`, `created_at`, `updated_at`.

### 📌 Group B: Knowledge Ingestion & Gaps
3. **`DOCUMENT`** `[Strong Entity]` — `_id_ (PK)`, `title`, `filename`, `file_type`, `file_path`, `file_size`, `uploaded_by`, `department`, `(-total_chunks-)`, `status`, `upload_date`, `created_at`.
4. **`DOCUMENT_CHUNK`** `[[Weak Entity]]` — `- -chunk_no- - (Partial Key)`, `_id_ (PK)`, `document_id (FK)`, `chunk_text`, `token_count`, `page`, `chroma_doc_id`, `created_at`.
5. **`KNOWLEDGE_GAP`** `[Entity]` — `_id_ (PK)`, `unanswered_query (UQ)`, `department`, `attempt_count`, `status`, `created_at`.

### 📌 Group C: RAG & Interaction History
6. **`CONVERSATION_MEMORY`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `session_id`, `query`, `response`, `summary`, `((follow_up_references))`, `importance_score`, `created_at`.
7. **`SEARCH_HISTORY`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `query`, `department`, `search_mode`, `(-results_found-)`, `top_similarity_score`, `execution_time_ms`, `search_time`, `timestamp`.
8. **`RESPONSE_HISTORY`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `query`, `response`, `model`, `response_time`, `response_time_ms`, `confidence_score`, `grounded_status`, `(-citations_count-)`, `created_at`.

### 📌 Group D: Decision Support & Agent Orchestration
9. **`ENTERPRISE_DECISION`** `[Entity]` — `_id_ (PK)`, `title`, `department`, `decision`, `reason`, `priority`, `decision_date`, `owner`, `((tags))`, `status`, `is_pinned`, `view_count`, `created_at`.
10. **`DECISION_LOG`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `query`, `intent`, `complexity`, `department`, `search_confidence_score`, `enough_context`, `memory_consulted`, `multiple_docs_needed`, `retrieval_strategy`, `recommendation`, `((reasons))`, `confidence_score`, `routing_target`, `decision_latency_ms`, `created_at`.
11. **`DECISION_ANALYTICS_SUMMARY`** `[Entity]` — `_id_ (PK)`, `date`, `total_decisions`, `avg_decision_time_ms`, `search_success_rate`, `memory_utilization_rate`, `routing_accuracy`, `created_at`.
12. **`ORCHESTRATION_LOG`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `session_id`, `query`, `intent`, `complexity`, `department`, `((execution_plan))`, `((agents_triggered))`, `((routing_reasons))`, `aggregated_context_summary`, `total_execution_time_ms`, `planning_time_ms`, `success`, `created_at`.
13. **`ORCHESTRATION_ANALYTICS`** `[Entity]` — `_id_ (PK)`, `total_tasks_executed`, `avg_planning_time_ms`, `agent_success_rate`, `total_requests_processed`, `((agent_utilization))`, `created_at`.

### 📌 Group E: Memory System Telemetry
14. **`PINNED_MEMORY`** `[Entity]` — `_id_ (PK)`, `memory_type`, `memory_ref_id`, `title`, `content`, `department`, `created_at`.
15. **`RECENT_CONTEXT`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `session_id`, `context_summary`, `last_query`, `updated_at`.
16. **`MEMORY_ANALYTICS`** `[Entity]` — `_id_ (PK)`, `date`, `total_memories`, `avg_retrieval_time_ms`, `context_accuracy`, `created_at`.

### 📌 Group F: System Telemetry
17. **`ANALYTICS_AGENT_LOG`** `[Entity]` — `_id_ (PK)`, `user_id (FK)`, `event_type`, `metric_name`, `metric_value`, `department`, `((details))`, `created_at`.

### 📌 Group G: n8n Automations (2 Separated Entities)
18. **`N8N_GAP_ALERT_WORKFLOW`** `[n8n Entity]` — `_workflow_id_ (PK)`, `workflow_name`, `trigger_event`, `occurrence_threshold`, `target_role`, `last_triggered_at`.
19. **`N8N_ANALYTICS_REPORT_WORKFLOW`** `[n8n Entity]` — `_workflow_id_ (PK)`, `workflow_name`, `cron_schedule`, `report_format`, `((recipient_list))`, `last_executed_at`.

---

## 🔄 2. Complete List of All 20 Relationships

1. **`USER`** `1` ──── `< has >` ──── `1` **`USER_PREFERENCE`**
2. **`USER`** `1` ──── `< uploads >` ──── `N` **`DOCUMENT`**
3. **`DOCUMENT`** `1` ════ `<< splits into / contains >>` ════ `N` **`DOCUMENT_CHUNK`** *(Identifying Relationship)*
4. **`USER`** `1` ──── `< conducts >` ──── `N` **`CONVERSATION_MEMORY`**
5. **`USER`** `1` ──── `< executes >` ──── `N` **`SEARCH_HISTORY`**
6. **`USER`** `1` ──── `< receives >` ──── `N` **`RESPONSE_HISTORY`**
7. **`USER`** `1` ──── `< logs >` ──── `N` **`ANALYTICS_AGENT_LOG`**
8. **`USER`** `1` ──── `< maintains >` ──── `N` **`RECENT_CONTEXT`**
9. **`USER`** `1` ──── `< records >` ──── `N` **`DECISION_LOG`**
10. **`USER`** `1` ──── `< orchestrates >` ──── `N` **`ORCHESTRATION_LOG`**
11. **`RESPONSE_HISTORY`** `1` ──── `< triggers >` ──── `0..1` **`KNOWLEDGE_GAP`**
12. **`CONVERSATION_MEMORY`** `1` ──── `< pins >` ──── `0..N` **`PINNED_MEMORY`**
13. **`CONVERSATION_MEMORY`** `N` ──── `< summarized by >` ──── `1` **`MEMORY_ANALYTICS`**
14. **`DECISION_LOG`** `1` ──── `< references >` ──── `0..N` **`ENTERPRISE_DECISION`**
15. **`DECISION_LOG`** `N` ──── `< summarized by >` ──── `1` **`DECISION_ANALYTICS_SUMMARY`**
16. **`ORCHESTRATION_LOG`** `N` ──── `< evaluated by >` ──── `1` **`ORCHESTRATION_ANALYTICS`**
17. **`N8N_GAP_ALERT_WORKFLOW`** `1` ──── `< monitors >` ──── `N` **`KNOWLEDGE_GAP`**
18. **`N8N_GAP_ALERT_WORKFLOW`** `1` ──── `< notifies >` ──── `1` **`USER`** *(Knowledge Owner)*
19. **`N8N_ANALYTICS_REPORT_WORKFLOW`** `1` ──── `< aggregates >` ──── `N` **`ANALYTICS_AGENT_LOG`**
20. **`N8N_ANALYTICS_REPORT_WORKFLOW`** `1` ──── `< dispatches to >` ──── `N` **`USER`** *(Stakeholders)*

---

## 📊 3. Final Cardinality Summary Box

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                       CARDINALITY SUMMARY (20 RELATIONSHIPS)                  │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. USER 1 ───────────────── 1    USER_PREFERENCE          (has)               │
│ 2. USER 1 ───────────────── N    DOCUMENT                 (uploads)           │
│ 3. DOCUMENT 1 ═════════════ N    DOCUMENT_CHUNK           (contains/splits)   │
│ 4. USER 1 ───────────────── N    CONVERSATION_MEMORY      (conducts)          │
│ 5. USER 1 ───────────────── N    SEARCH_HISTORY           (executes)          │
│ 6. USER 1 ───────────────── N    RESPONSE_HISTORY         (receives)          │
│ 7. USER 1 ───────────────── N    ANALYTICS_AGENT_LOG      (logs)              │
│ 8. USER 1 ───────────────── N    RECENT_CONTEXT           (maintains)         │
│ 9. USER 1 ───────────────── N    DECISION_LOG             (records)           │
│ 10. USER 1 ──────────────── N    ORCHESTRATION_LOG        (orchestrates)      │
│ 11. RESPONSE_HISTORY 1 ──── 0..1 KNOWLEDGE_GAP            (triggers)          │
│ 12. CONVERSATION_MEMORY 1 ── 0..N PINNED_MEMORY            (pins)              │
│ 13. CONVERSATION_MEMORY N ── 1    MEMORY_ANALYTICS         (summarized by)     │
│ 14. DECISION_LOG 1 ───────── 0..N ENTERPRISE_DECISION      (references)        │
│ 15. DECISION_LOG N ───────── 1    DECISION_ANALYTICS_SUMMARY (summarized by) │
│ 16. ORCHESTRATION_LOG N ──── 1    ORCHESTRATION_ANALYTICS  (evaluated by)    │
│ 17. N8N_GAP_ALERT_WF 1 ───── N    KNOWLEDGE_GAP            (monitors)          │
│ 18. N8N_GAP_ALERT_WF 1 ───── 1    USER                     (notifies)          │
│ 19. N8N_ANALYTICS_REPORT_WF 1 N   ANALYTICS_AGENT_LOG      (aggregates)        │
│ 20. N8N_ANALYTICS_REPORT_WF 1 N   USER                     (dispatches to)     │
└───────────────────────────────────────────────────────────────────────────────┘
```
