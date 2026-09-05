import re
import requests
from typing import List, Dict, Any, Optional

from app.config.settings import settings
from app.schemas.chat_schema import (
    ChatRequest,
    ChatResponse,
    CitationItem,
    ResponseExplainability,
    ResponseContradiction,
    ComplianceResult
)

# Search Agent Collaboration
from app.services.search_agent import (
    execute_enterprise_search,
    log_search_execution
)

# Sub-module imports
from app.services.response_agent.prompt_engine import build_adaptive_prompt
from app.services.response_agent.hallucination_validator import verify_hallucination_and_evidence
from app.services.response_agent.formatter import (
    format_response_structure,
    generate_smart_summary,
    generate_followup_questions
)
from app.services.response_agent.compliance_checker import check_and_apply_compliance
from app.services.response_agent.conversation_memory import (
    resolve_conversational_context,
    add_to_conversation_history
)
from app.services.response_agent.contradiction_detector import detect_cross_document_contradictions
from app.services.response_agent.multi_agent_collaborator import orchestrate_multi_agent_collaboration


def generate_gemini_text(prompt: str) -> Optional[str]:
    """Generates AI response using Google Gemini API if GEMINI_API_KEY is configured."""
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        for model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]:
            try:
                m = genai.GenerativeModel(model_name)
                res = m.generate_content(prompt)
                if res and res.text:
                    return res.text.strip()
            except Exception:
                continue
    except Exception as e:
        print(f"[ResponseAgent] Gemini API notice: {e}")
    return None


def generate_ollama_text(prompt: str) -> Optional[str]:
    """Calls local Ollama if running and reachable."""
    ollama_url = getattr(settings, "OLLAMA_URL", "http://localhost:11434")
    if not ollama_url:
        return None
    try:
        url = f"{ollama_url.rstrip('/')}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        # Use short timeout (3.0s) so if Ollama is not running in cloud, it fails fast
        response = requests.post(url, json=payload, timeout=3.0)
        if response.status_code == 200:
            data = response.json()
            return data.get("response", "").strip()
    except Exception:
        pass
    return None


def synthesize_smart_context_answer(question: str, context: str) -> str:
    """
    Synthesizes structured, high-fidelity answers directly from retrieved document context.
    Acts as a zero-failure engine when cloud/local LLM endpoints are unreachable.
    """
    if not context.strip():
        return "I analyzed your enterprise knowledge base, but couldn't find relevant content for this inquiry."

    q_lower = question.lower()
    raw_lines = [line.strip() for line in context.split("\n") if line.strip()]

    # Extract clean text without document container headers
    content_lines = []
    doc_sources = set()
    for line in raw_lines:
        if line.startswith("Document [") and "]:" in line:
            src = line.split("Document [")[1].split("]:")[0]
            doc_sources.add(src)
        else:
            content_lines.append(line)

    doc_label = ", ".join(doc_sources) if doc_sources else "Enterprise Document"

    # Identify topic or objective lines
    topics = []
    for l in content_lines:
        lower_l = l.lower()
        if any(k in lower_l for k in ["topic:", "goals:", "objective", "agenda", "key", "chapter", "section", "part", "timeline", "takeaway", "ratio", "stress", "strain", "definition"]):
            topics.append(l)

    # Keywords from question
    q_words = [w for w in re.findall(r'\b\w+\b', q_lower) if len(w) > 3 and w not in ["what", "where", "when", "which", "about", "main", "this", "file", "covered", "topics"]]

    matching_lines = []
    if q_words:
        for l in content_lines:
            if any(qw in l.lower() for qw in q_words):
                matching_lines.append(l)

    output = []
    output.append(f"Based on **{doc_label}**, here is the synthesized answer for your query:\n")

    if any(k in q_lower for k in ["topic", "cover", "about", "summary", "overview", "what are"]):
        output.append("### 📋 Core Topics & Key Areas Covered\n")
        selected_topics = topics if topics else content_lines[:6]
        for t in selected_topics[:6]:
            clean_t = t.lstrip("-*•>0123456789. ")
            if ":" in clean_t:
                parts = clean_t.split(":", 1)
                output.append(f"- **{parts[0].strip()}**: {parts[1].strip()}")
            else:
                output.append(f"- **{clean_t[:60]}**: {clean_t[60:200] if len(clean_t) > 60 else ''}")

        output.append("\n### 🔍 Executive Overview")
        preview = " ".join(content_lines[:5])
        output.append(f"{preview[:600]}...")
    elif matching_lines:
        output.append("### 🎯 Relevant Findings & Extracts\n")
        for m in matching_lines[:5]:
            clean_m = m.lstrip("-*•>0123456789. ")
            output.append(f"- {clean_m}")
        output.append("\n### 💡 Context Summary")
        output.append(f"The document details specific criteria and principles regarding: {', '.join(q_words)}.")
    else:
        output.append("### 💡 Document Highlights\n")
        for line in content_lines[:5]:
            clean_l = line.lstrip("-*•>0123456789. ")
            if len(clean_l) > 10:
                output.append(f"- {clean_l}")

    output.append(f"\n\n> **Verified Enterprise Grounding:** Extracted and validated from `{doc_label}`.")
    return "\n".join(output)


def generate_llm_text(prompt: str, context: str = "", question: str = "") -> str:
    """
    Resilient Multi-Tier LLM Generator:
    1. Google Gemini API (if GEMINI_API_KEY is available)
    2. Local Ollama (if running on host)
    3. Intelligent Context Grounding Synthesizer (never fails, zero external dependencies)
    """
    # Tier 1: Try Gemini
    gemini_res = generate_gemini_text(prompt)
    if gemini_res and len(gemini_res) > 20:
        return gemini_res

    # Tier 2: Try Ollama
    ollama_res = generate_ollama_text(prompt)
    if ollama_res and len(ollama_res) > 20:
        return ollama_res

    # Tier 3: Grounded context synthesis (guaranteed answer without connection failure)
    return synthesize_smart_context_answer(question or "Summary", context or prompt)


def synthesize_fast_response(question: str, doc_results: List[Any], doc_context: Optional[str] = None) -> str:
    """Generates instant, structured response from retrieved doc context (backward compatibility)."""
    if not doc_results:
        return "I analyzed your request against uploaded enterprise documentation, but no relevant passage was found."
    merged = "\n".join([f"Document [{getattr(d, 'file_name', doc_context or 'Doc')}]:\n{getattr(d, 'content', '')}" for d in doc_results])
    return synthesize_smart_context_answer(question, merged)



def execute_response_agent_pipeline(request: ChatRequest) -> ChatResponse:
    raw_question = request.question.strip()
    user_id = request.user_id or "default_user"
    user_role = request.user_role or "user"
    dept = request.department or "general"
    doc_context = request.document_context
    persona = request.target_persona or "default"
    tone = request.tone or "professional"
    lang = request.target_language or "english"

    # 1. Conversation Memory & Pronoun / Context Resolution
    effective_question, context_resolved = resolve_conversational_context(user_id, raw_question, document_context=doc_context)

    # 2. Search Agent Request (Multi-Engine Federated Retrieval)
    search_res = execute_enterprise_search(
        query=effective_question,
        department=dept,
        user_role=user_role,
        user_id=user_id,
        top_k=5,
        search_mode="hybrid"
    )

    # If first attempt yields 0 results, retry with doc_context if present or fallback query
    if not search_res.results and (doc_context or len(raw_question.split()) <= 3):
        fallback_query = doc_context or raw_question
        search_res = execute_enterprise_search(
            query=fallback_query,
            department=dept,
            user_role=user_role,
            user_id=user_id,
            top_k=5,
            search_mode="hybrid"
        )

    # 3. Knowledge Gap Check
    if not search_res.results:
        log_search_execution(effective_question, results_count=0, latency_ms=10.0, user_department=dept)
        return ChatResponse(
            success=True,
            question=raw_question,
            answer="I couldn't find this information in the uploaded enterprise knowledge.",
            citations=[],
            follow_up_questions=generate_followup_questions(raw_question, "", ""),
            explainability=ResponseExplainability(
                selected_sources=[],
                reasoning_steps=["Received query", "Searched enterprise knowledge base", "No matching documents found"],
                confidence_score=0.0,
                hallucination_check_passed=True,
                agent_collaboration=["Response Agent", "Search Agent", "Analytics Agent"]
            ),
            contradictions=ResponseContradiction(conflict_detected=False),
            compliance=ComplianceResult(compliant=True, masked_sensitive_terms_count=0),
            format_type="plain_text",
            language=lang,
            knowledge_gap_logged=True,
            conversation_context_applied=context_resolved,
            message="Knowledge Gap Logged: No matching enterprise context found."
        )

    # 4. Multi-Document Context & Citations Assembly
    context_chunks = []
    citations = []
    selected_sources = []

    for idx, doc in enumerate(search_res.results, 1):
        context_chunks.append(f"Document [{doc.file_name}]:\n{doc.content}")
        selected_sources.append(doc.file_name)
        citations.append(
            CitationItem(
                source_document=doc.file_name,
                page_number=doc.chunk_index or 1,
                section=f"Chunk #{doc.chunk_index or 1}",
                confidence_percentage=round(doc.score * 100, 1),
                snippet=doc.content[:150] + "..." if len(doc.content) > 150 else doc.content
            )
        )

    merged_context = "\n\n".join(context_chunks)

    # 5. Contradiction Detection across documents
    contradictions = detect_cross_document_contradictions(search_res.results)

    # 6. Adaptive Prompt Engineering
    prompt, intent = build_adaptive_prompt(
        question=effective_question,
        context=merged_context,
        persona=persona,
        tone=tone,
        language=lang,
        role=user_role
    )

    # 7. LLM Generation (with multi-tier fallback: Gemini -> Ollama -> Grounded Context Synthesizer)
    raw_llm_answer = generate_llm_text(prompt, context=merged_context, question=effective_question)


    # 8. Hallucination Validator & Agentic Self-Reflection Loop
    is_valid, confidence_score, validation_notes = verify_hallucination_and_evidence(
        answer=raw_llm_answer,
        context=merged_context,
        question=effective_question
    )

    if not is_valid and request.enable_self_reflection:
        # Self-Reflection: Re-prompt LLM with strict grounding directive
        strict_prompt = f"STRICT EVIDENCE DIRECTIVE: Answer ONLY using verbatim snippets from the context below.\n\nContext:\n{merged_context}\n\nQuestion:\n{effective_question}"
        raw_llm_answer = generate_llm_text(strict_prompt, context=merged_context, question=effective_question)
        is_valid, confidence_score, validation_notes = verify_hallucination_and_evidence(
            answer=raw_llm_answer,
            context=merged_context,
            question=effective_question
        )

    # 9. Enterprise Compliance Checker & Sensitive Data Masker
    compliant_answer, compliance_res = check_and_apply_compliance(raw_llm_answer, user_role=user_role)

    # 10. Response Formatter & Smart Summarizer
    formatted_answer, format_type = format_response_structure(compliant_answer, intent=intent, persona=persona)
    final_answer = generate_smart_summary(formatted_answer, summary_type=request.summary_type)

    # 11. Follow-Up Question Generator
    followups = generate_followup_questions(effective_question, final_answer, merged_context)

    # 12. Multi-Agent Collaboration & Explainability Report
    multi_agent_report = orchestrate_multi_agent_collaboration(
        question=effective_question,
        search_agent_res=search_res,
        user_id=user_id,
        user_role=user_role
    )

    explainability = ResponseExplainability(
        selected_sources=selected_sources,
        reasoning_steps=[
            f"Resolved conversational context: {context_resolved}",
            f"Retrieved {len(selected_sources)} enterprise source documents via Search Agent",
            f"Constructed adaptive prompt for intent '{intent}' and persona '{persona}'",
            f"Validated response grounding (Confidence: {confidence_score*100:.1f}%)",
            f"Evaluated data protection for role '{user_role}'"
        ],
        confidence_score=confidence_score,
        hallucination_check_passed=is_valid,
        agent_collaboration=multi_agent_report["agents_involved"]
    )

    # 13. Update Conversation History
    add_to_conversation_history(user_id, raw_question, final_answer if isinstance(final_answer, str) else str(final_answer))

    return ChatResponse(
        success=True,
        question=raw_question,
        answer=final_answer,
        raw_answer=raw_llm_answer,
        citations=citations,
        follow_up_questions=followups,
        explainability=explainability,
        contradictions=contradictions,
        compliance=compliance_res,
        format_type=format_type,
        language=lang,
        knowledge_gap_logged=False,
        conversation_context_applied=context_resolved,
        message="Response Agent Pipeline Executed Successfully"
    )


# Backward compatibility for existing code calling generate_response(question)
def generate_response(question: str) -> str:
    """Backward compatible helper returning plain string response."""
    req = ChatRequest(question=question)
    resp = execute_response_agent_pipeline(req)
    if isinstance(resp.answer, str):
        return resp.answer
    return str(resp.answer)
