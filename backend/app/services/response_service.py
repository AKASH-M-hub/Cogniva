import google.generativeai as genai

from app.config.settings import settings
from app.services.search_service import search_documents

# Configure Gemini
genai.configure(
    api_key=settings.GEMINI_API_KEY
)

# Create Gemini Model
model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


def generate_response(question: str):

    # Retrieve relevant chunks from ChromaDB
    context = search_documents(question)

    # If no relevant documents found
    if context.strip() == "":
        return "No relevant enterprise knowledge found."

    prompt = f"""
You are Cogniva Enterprise AI.

You are an enterprise knowledge assistant.

Answer ONLY using the enterprise knowledge below.

==============================
Enterprise Knowledge
==============================

{context}

==============================
Question
==============================

{question}

Instructions:
1. Give a professional answer.
2. Do NOT make up information.
3. If the answer is unavailable in the context, reply:
'I couldn't find this information in the uploaded enterprise knowledge.'
"""

    response = model.generate_content(prompt)

    return response.text