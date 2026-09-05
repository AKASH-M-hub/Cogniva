import re
from typing import List, Dict, Any, Optional, Tuple


def format_response_structure(
    answer: str,
    intent: str = "explain",
    persona: str = "default"
) -> Tuple[str, str]:
    """
    Response Formatter Engine:
    Selects the optimal presentation format (Markdown Table, Executive Summary, Bulleted List).
    """
    if "couldn't find this information" in answer.lower() or "no relevant enterprise knowledge" in answer.lower():
        return answer, "plain_text"

    if intent == "compare" and "table" not in answer.lower() and "|" not in answer:
        # Format comparison into Markdown Table
        lines = [line.strip() for line in answer.split("\n") if line.strip()]
        formatted_table = "### 📊 Enterprise Comparison Matrix\n\n"
        formatted_table += "| Feature / Policy | Specification Details |\n"
        formatted_table += "| :--- | :--- |\n"
        for line in lines[:6]:
            if ":" in line:
                parts = line.split(":", 1)
                formatted_table += f"| **{parts[0].strip()}** | {parts[1].strip()} |\n"
            else:
                formatted_table += f"| **Overview** | {line} |\n"
        return formatted_table, "markdown_table"

    if persona == "executive":
        exec_summary = f"### 🏢 Executive Summary\n\n{answer}\n\n**Strategic Takeaway:** Alignment with enterprise governance and compliance standards."
        return exec_summary, "executive_summary"

    return answer, "markdown"


def generate_smart_summary(text: str, summary_type: Optional[str] = None) -> str:
    """Smart Summarization: 5-line summary, 1-page summary, or Executive summary."""
    if not summary_type:
        return text

    sentences = [s.strip() for s in re.split(r'[.!?]', text) if len(s.strip()) > 10]
    
    if summary_type == "5-line":
        summary_lines = sentences[:5]
        return "### 📝 5-Line Summary\n" + "\n".join(f"{idx+1}. {line}." for idx, line in enumerate(summary_lines))
    elif summary_type == "executive":
        return f"### 📊 Executive Brief\n\n" + " ".join(sentences[:3]) + "."
    
    return text


def generate_followup_questions(question: str, answer: str, context: str) -> List[str]:
    """Follow-Up Generator: Generates 3 relevant contextual follow-up questions."""
    q_lower = question.lower()
    followups = []

    if "cogniva" in q_lower or "architecture" in q_lower or "srs" in q_lower:
        followups = [
            "Explain the Search Agent architecture in Cogniva",
            "How does Cogniva ensure enterprise data security and RBAC?",
            "What is the Memory Agent lifecycle in Cogniva?"
        ]
    elif "leave" in q_lower or "hr" in q_lower or "policy" in q_lower or "onboarding" in q_lower:
        followups = [
            "What is the vacation approval workflow?",
            "Explain medical leave rules and documentation requirements",
            "What is the remote work policy?"
        ]
    elif "api" in q_lower or "contract" in q_lower:
        followups = [
            "Show the authentication API endpoints",
            "Explain the Search API payload schema",
            "How to test database connections in Cogniva?"
        ]
    else:
        followups = [
            "Can you provide a more detailed breakdown?",
            "Which enterprise documents reference this information?",
            "Are there any associated SOPs or guidelines?"
        ]

    return followups
