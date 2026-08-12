from typing import Dict, List, Optional, Tuple

# In-memory storage for multi-turn chat sessions
CONVERSATION_HISTORY_STORE: Dict[str, List[Dict[str, str]]] = {}


def add_to_conversation_history(user_id: str, question: str, answer: str):
    """Stores recent turn in user's conversation history."""
    if user_id not in CONVERSATION_HISTORY_STORE:
        CONVERSATION_HISTORY_STORE[user_id] = []
    
    CONVERSATION_HISTORY_STORE[user_id].append({
        "question": question,
        "answer": answer
    })

    # Keep top 10 turns
    if len(CONVERSATION_HISTORY_STORE[user_id]) > 10:
        CONVERSATION_HISTORY_STORE[user_id] = CONVERSATION_HISTORY_STORE[user_id][-10:]


def resolve_conversational_context(user_id: str, question: str, document_context: Optional[str] = None) -> Tuple[str, bool]:
    """
    Response Memory Engine:
    Resolves pronouns, short follow-up prompts (e.g., 'explain breifly', 'summarize', 'tell me more'),
    and active document context.
    """
    q_clean = question.strip()
    q_lower = q_clean.lower()
    history = CONVERSATION_HISTORY_STORE.get(user_id, [])

    # If document_context is provided (e.g. from Explore Echo)
    if document_context:
        short_followups = ["explain breifly", "explain briefly", "summarize", "tell me more", "details", "explain", "overview", "what does this mean", "why", "give key points"]
        if any(f in q_lower for f in short_followups) or len(q_clean.split()) <= 3:
            return f"Summarize and explain the key findings and details from document '{document_context}'", True
        return f"{q_clean} (regarding document '{document_context}')", True

    if not history:
        short_followups = ["explain breifly", "explain briefly", "summarize", "tell me more", "details", "explain"]
        if any(f in q_lower for f in short_followups):
            return "Provide a comprehensive executive summary of key enterprise reports and uploaded knowledge.", True
        return question, False

    last_turn = history[-1]
    last_q = last_turn["question"]

    conversational_triggers = [
        "explain breifly", "explain briefly", "summarize", "tell me more", "details",
        "second module", "third module", "that policy", "it", "its", "the same document",
        "above topic", "elaborate", "explain", "what about", "why", "how so"
    ]

    if any(trigger in q_lower for trigger in conversational_triggers) or len(q_clean.split()) <= 3:
        resolved_q = f"Regarding '{last_q}': {q_clean}"
        return resolved_q, True

    return question, False
