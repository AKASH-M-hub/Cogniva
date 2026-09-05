from typing import Dict, Any, Optional, Tuple

PROMPT_INTENT_TEMPLATES = {
    "compare": """You are Cogniva Enterprise AI.
Your task is to COMPARE the topics requested based ONLY on the provided Enterprise Knowledge.
Present the comparison clearly using a structured format (use markdown tables or side-by-side bullet lists).""",

    "summarize": """You are Cogniva Enterprise AI.
Your task is to SUMMARIZE the provided Enterprise Knowledge concisely.
Focus on key takeaways, core policies, and actionable executive insights.""",

    "explain": """You are Cogniva Enterprise AI.
Your task is to EXPLAIN the concept clearly and thoroughly based ONLY on the provided Enterprise Knowledge.""",

    "list": """You are Cogniva Enterprise AI.
Your task is to LIST all relevant items, steps, or rules clearly in bullet points based ONLY on the provided Enterprise Knowledge.""",

    "default": """You are Cogniva Enterprise AI.
You are an enterprise knowledge assistant. Answer ONLY using the enterprise knowledge provided."""
}

PERSONA_GUIDELINES = {
    "executive": "Format answer as a high-level Executive Summary with strategic impact and key metrics.",
    "developer": "Provide a detailed technical explanation with code snippets, architecture details, and schema specs.",
    "manager": "Provide operational guidelines, workflow steps, team responsibilities, and SLA timelines.",
    "intern": "Use simple, clear, easy-to-understand explanations with minimal jargon.",
    "default": "Provide a clear, professional enterprise response."
}

MULTILINGUAL_INSTRUCTIONS = {
    "tamil": "Translate and respond ENTIRELY in Tamil language (தமிழ்). Maintain enterprise accuracy.",
    "hindi": "Translate and respond ENTIRELY in Hindi language (हिंदी). Maintain enterprise accuracy.",
    "spanish": "Translate and respond ENTIRELY in Spanish language (Español).",
    "french": "Translate and respond ENTIRELY in French language (Français).",
    "german": "Translate and respond ENTIRELY in German language (Deutsch).",
    "english": "Respond in English."
}


def build_adaptive_prompt(
    question: str,
    context: str,
    persona: str = "default",
    tone: str = "professional",
    language: str = "english",
    role: str = "user"
) -> Tuple[str, str]:
    """
    Adaptive Prompt Engineering Engine:
    Selects specialized prompt template based on query intent, persona, tone, language, and user role.
    """
    lower_q = question.lower()
    
    # 1. Intent Detection
    if "compare" in lower_q or "vs" in lower_q or "difference" in lower_q:
        intent = "compare"
    elif "summarize" in lower_q or "summary" in lower_q:
        intent = "summarize"
    elif "list" in lower_q or "steps" in lower_q or "rules" in lower_q:
        intent = "list"
    else:
        intent = "explain"

    system_instruction = PROMPT_INTENT_TEMPLATES.get(intent, PROMPT_INTENT_TEMPLATES["default"])
    persona_instruction = PERSONA_GUIDELINES.get(persona.lower(), PERSONA_GUIDELINES["default"])
    language_instruction = MULTILINGUAL_INSTRUCTIONS.get(language.lower(), MULTILINGUAL_INSTRUCTIONS["english"])

    full_prompt = f"""{system_instruction}

CRITICAL STRICT GROUNDING RULES:
1. You are strictly an Enterprise Knowledge Assistant.
2. Answer the user's question based EXCLUSIVELY on the facts, concepts, equations, and data provided in the "Enterprise Knowledge" section below.
3. If the user's question asks about external topics, general trivia, unrelated entities, or anything NOT covered in the provided Enterprise Knowledge, you MUST NOT answer from general knowledge and you MUST NOT guess or hallucinate.
4. If the information is not directly in the Enterprise Knowledge below, reply EXACTLY:
"I couldn't find this information in the uploaded enterprise knowledge."

Persona Mode: {persona.upper()} ({persona_instruction})
Tone: {tone.capitalize()}
Role Scope: {role.upper()}
Language Instruction: {language_instruction}

==============================
Enterprise Knowledge
==============================

{context}

==============================
Question
==============================

{question}
"""
    return full_prompt, intent
