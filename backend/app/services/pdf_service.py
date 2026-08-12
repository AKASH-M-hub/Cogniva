import os
from pypdf import PdfReader


def extract_text(file_path: str) -> str:
    """Extracts text from PDF, TXT, DOCX, MD, and code files robustly."""
    if not os.path.exists(file_path):
        return ""

    ext = os.path.splitext(file_path)[1].lower()

    # 1. Plain Text / Markdown / Code files
    if ext in [".txt", ".md", ".json", ".csv", ".py", ".js", ".html", ".log"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            pass

    # 2. PDF Files
    if ext == ".pdf":
        try:
            reader = PdfReader(file_path)
            extracted_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
            if extracted_text.strip():
                return extracted_text
        except Exception as e:
            print(f"pypdf extraction notice: {e}")

    # 3. DOCX Files
    if ext in [".docx", ".doc"]:
        try:
            import docx
            doc = docx.Document(file_path)
            full_text = [para.text for para in doc.paragraphs if para.text]
            if full_text:
                return "\n".join(full_text)
        except Exception as e:
            print(f"docx extraction notice: {e}")

    # Fallback: Read raw bytes as string with ignore errors
    try:
        with open(file_path, "rb") as f:
            content = f.read()
            # Filter printable ASCII/UTF-8 strings
            text = content.decode("utf-8", errors="ignore")
            # Clean non-printable control characters
            cleaned = "".join(c for c in text if c.isprintable() or c in "\n\r\t")
            if len(cleaned.strip()) > 20:
                return cleaned
    except Exception:
        pass

    return f"Document File: {os.path.basename(file_path)}\nUploaded to Knowledge Hub."