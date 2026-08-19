# Cogniva Enterprise AI Platform — Enhanced Chen Notation ER Diagram Specification

This specification incorporates advanced **Chen Notation** concepts including:
- **Weak Entities `[[ ]]`** & **Identifying Relationships `<< >>`**
- **Multivalued Attributes `(( ))`** (e.g. JSON arrays)
- **Derived Attributes `( - - )`** (e.g. counts calculated from linked tables)
- **Varied Relationship Verbs `< >`** (`has`, `contains`, `logs`, `triggers`, `monitors`, `aggregates`, `uploads`, `executes`)

---

## 1. Symbol Notation Guide

| Chen Notation Element | Visual Symbol | Cogniva Architectural Example |
| :--- | :--- | :--- |
| **Strong Entity** | Single Rectangle `[ ]` | `[ USER ]`, `[ DOCUMENT ]`, `[ KNOWLEDGE_GAP ]` |
| **Weak Entity** | Double Rectangle `[[ ]]` | `[[ DOCUMENT_CHUNK ]]` (dependent on `[ DOCUMENT ]`) |
| **Identifying Relationship** | Double Diamond `<< >>` | `<< contains / splits into >>` |
| **Regular Relationship** | Single Diamond `< >` | `< has >`, `< logs >`, `< triggers >`, `< monitors >` |
| **Key Attribute (PK)** | Underlined Oval `_Attribute_` | `_id_`, `_employee_id_` |
| **Multivalued Attribute** | Double Oval `(( ))` | `(( favorite_docs ))`, `(( follow_up_references ))` |
| **Derived Attribute** | Dashed Oval `( - - )` | `( - total_chunks - )`, `( - citations_count - )` |
| **Foreign Key (FK)** | Oval with `(FK)` label | `(user_id (FK))`, `(document_id (FK))` |

---

## 2. Advanced Entity & Attribute Catalog

### 1. `USER` `[Strong Entity]`
- `_id_` (PK, INT) — *Underlined*
- `full_name` (VARCHAR)
- `email` (VARCHAR, UQ)
- `employee_id` (VARCHAR)
- `password` (VARCHAR)
- `role` (VARCHAR)
- `department` (VARCHAR)
- `created_at` (TIMESTAMP)

### 2. `USER_PREFERENCE` `[Entity]`
- `_id_` (PK, INT) — *Underlined*
- `user_id` (FK, VARCHAR, UQ)
- `department` (VARCHAR)
- `role` (VARCHAR)
- `language` (VARCHAR)
- `preferred_tone` (VARCHAR)
- `(( favorite_docs ))` — **Multivalued Attribute** (JSON Array)
- `(( frequently_accessed ))` — **Multivalued Attribute** (JSON Array)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. `DOCUMENT` `[Strong Entity]`
- `_id_` (PK, INT) — *Underlined*
- `title` (VARCHAR)
- `filename` (VARCHAR)
- `file_type` (VARCHAR)
- `file_path` (VARCHAR)
- `file_size` (INT)
- `uploaded_by` (VARCHAR)
- `department` (VARCHAR)
- `( - total_chunks - )` — **Derived Attribute** (calculated from `DOCUMENT_CHUNK` count)
- `status` (VARCHAR)
- `upload_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### 4. `DOCUMENT_CHUNK` `[[Weak Entity]]`
*(Dependent on `DOCUMENT` for existence; deleted via ON DELETE CASCADE)*
- `_chunk_no_` (Partial Key / Discriminator, INT) — *Dashed Underline*
- `id` (PK, INT)
- `document_id` (FK, INT)
- `chunk_text` (TEXT)
- `token_count` (INT)
- `page` (INT)
- `chroma_doc_id` (VARCHAR)
- `created_at` (TIMESTAMP)

### 5. `CONVERSATION_MEMORY` `[Entity]`
- `_id_` (PK, INT)
- `user_id` (FK, VARCHAR)
- `session_id` (VARCHAR)
- `query` (TEXT)
- `response` (TEXT)
- `summary` (TEXT)
- `(( follow_up_references ))` — **Multivalued Attribute** (JSON Array)
- `importance_score` (FLOAT)
- `created_at` (TIMESTAMP)

### 6. `SEARCH_HISTORY` `[Entity]`
- `_id_` (PK, INT)
- `user_id` (FK, VARCHAR)
- `query` (TEXT)
- `department` (VARCHAR)
- `search_mode` (VARCHAR)
- `( - results_found - )` — **Derived Attribute** (count of search results returned)
- `top_similarity_score` (FLOAT)
- `execution_time_ms` (FLOAT)
- `search_time` (TIMESTAMP)
- `timestamp` (TIMESTAMP)

### 7. `RESPONSE_HISTORY` `[Entity]`
- `_id_` (PK, INT)
- `user_id` (FK, VARCHAR)
- `query` (TEXT)
- `response` (TEXT)
- `model` (VARCHAR)
- `response_time` (FLOAT)
- `response_time_ms` (FLOAT)
- `confidence_score` (FLOAT)
- `grounded_status` (VARCHAR)
- `( - citations_count - )` — **Derived Attribute** (count of citations extracted)
- `created_at` (TIMESTAMP)

### 8. `ANALYTICS_AGENT_LOG` `[Entity]`
- `_id_` (PK, INT)
- `user_id` (FK, VARCHAR)
- `event_type` (VARCHAR)
- `metric_name` (VARCHAR)
- `metric_value` (FLOAT)
- `department` (VARCHAR)
- `(( details ))` — **Multivalued Attribute** (JSON Metadata)
- `created_at` (TIMESTAMP)

### 9. `KNOWLEDGE_GAP` `[Entity]`
- `_id_` (PK, INT)
- `unanswered_query` (TEXT, UQ)
- `department` (VARCHAR)
- `attempt_count` (INT)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)

### 10. `N8N_WORKFLOW` `[Automation Entity]`
- `_workflow_id_` (PK, VARCHAR)
- `workflow_name` (VARCHAR)
- `trigger_type` (VARCHAR)
- `threshold_condition` (VARCHAR)
- `target_recipient` (VARCHAR)
- `last_executed_at` (TIMESTAMP)

---

## 3. Detailed Relationships & Action Verbs

1. **`USER`** `1` ──── `< has >` ──── `1` **`USER_PREFERENCE`**
2. **`USER`** `1` ──── `< uploads >` ──── `N` **`DOCUMENT`**
3. **`DOCUMENT`** `1` ════ `<< splits into / contains >>` ════ `N` **`DOCUMENT_CHUNK`** *(Identifying Relationship & Double Lines for Weak Entity)*
4. **`USER`** `1` ──── `< conducts >` ──── `N` **`CONVERSATION_MEMORY`**
5. **`USER`** `1` ──── `< executes >` ──── `N` **`SEARCH_HISTORY`**
6. **`USER`** `1` ──── `< receives >` ──── `N` **`RESPONSE_HISTORY`**
7. **`USER`** `1` ──── `< logs >` ──── `N` **`ANALYTICS_AGENT_LOG`**
8. **`RESPONSE_HISTORY`** `1` ──── `< triggers >` ──── `0..1` **`KNOWLEDGE_GAP`**
9. **`N8N_WORKFLOW`** `1` ──── `< monitors >` ──── `N` **`KNOWLEDGE_GAP`** *(Gap Alert Workflow: triggers email when `attempt_count >= 5`)*
10. **`N8N_WORKFLOW`** `1` ──── `< aggregates >` ──── `N` **`ANALYTICS_AGENT_LOG`** *(Weekly Analytics Workflow)*

---

## 4. Cardinality Summary Box

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CARDINALITY SUMMARY                           │
├────────────────────────────────────────────────────────────────────────┤
│ • USER 1 ──────────── 1    USER_PREFERENCE     (has)                   │
│ • USER 1 ──────────── N    DOCUMENT            (uploads)               │
│ • DOCUMENT 1 ════════ N    DOCUMENT_CHUNK      (splits into/contains)  │
│ • USER 1 ──────────── N    CONVERSATION_MEMORY (conducts)              │
│ • USER 1 ──────────── N    SEARCH_HISTORY      (executes)              │
│ • USER 1 ──────────── N    RESPONSE_HISTORY    (receives)              │
│ • USER 1 ──────────── N    ANALYTICS_AGENT_LOG (logs)                  │
│ • RESPONSE_HISTORY 1 ─ 0..1 KNOWLEDGE_GAP      (triggers)              │
│ • N8N_WORKFLOW 1 ──── N    KNOWLEDGE_GAP       (monitors)              │
│ • N8N_WORKFLOW 1 ──── N    ANALYTICS_AGENT_LOG (aggregates)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Extended Legend Box

```text
┌──────────────────────────────────────────────┐
│                    LEGEND                    │
├──────────────────────────────────────────────┤
│  [ Rectangles ]   = Strong Entity            │
│  [[ Double Rect ]] = Weak Entity             │
│  < Diamonds >     = Relationship             │
│  << Double Diam >>= Identifying Relationship │
│  ( Ovals )        = Single Attribute         │
│  (( Double Oval ))= Multivalued Attribute    │
│  ( - Dashed - )   = Derived Attribute        │
│  _Attribute_      = Primary Key (PK)         │
│  - - Partial - -  = Partial Key/Discriminator│
│  (FK)             = Foreign Key              │
│  (UQ)             = Unique Constraint        │
└──────────────────────────────────────────────┘
```
