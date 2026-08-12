import re
from typing import List, Dict, Any, Tuple


def verify_hallucination_and_evidence(
    answer: str,
    context: str,
    question: str
) -> Tuple[bool, float, List[str]]:
    """
    Hallucination Detector & Self-Reflection (Agentic RAG):
    Verifies that generated answer statements are anchored in the retrieved context.
    Returns (is_valid, confidence_score, verification_notes).
    """
    if "couldn't find this information" in answer.lower() or "no relevant enterprise knowledge" in answer.lower():
        return True, 1.0, ["Standard negative match response triggered cleanly."]

    if not context.strip():
        return False, 0.0, ["Hallucination risk: Answer generated with empty retrieved context."]

    context_words = set(re.findall(r'\w+', context.lower()))
    answer_words = [w.lower() for w in re.findall(r'\w+', answer) if len(w) > 3]

    if not answer_words:
        return True, 0.90, ["Short valid answer."]

    # Count how many key content words in answer exist in context
    matches = sum(1 for w in answer_words if w in context_words)
    overlap_ratio = matches / max(len(answer_words), 1)

    verification_notes = [f"Context term coverage: {round(overlap_ratio * 100, 1)}%"]

    if overlap_ratio < 0.25:
        verification_notes.append("Warning: Answer has low grounding in retrieved context.")
        return False, round(overlap_ratio, 2), verification_notes

    return True, round(min(0.99, max(0.5, overlap_ratio + 0.3)), 2), verification_notes
