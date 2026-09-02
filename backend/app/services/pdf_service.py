import os
import fitz
from rapidocr_onnxruntime import RapidOCR

# Initialize OCR minimally
ocr_engine = RapidOCR()

def extract_text(file_path: str) -> str:
    """Extracts text from PDF (including OCR for images), TXT, DOCX, MD, and images robustly."""
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

    # 2. PDF Files (with PyMuPDF and RapidOCR)
    if ext == ".pdf":
        try:
            doc = fitz.open(file_path)
            extracted_text = ""
            for page in doc:
                text = page.get_text()
                if text.strip():
                    extracted_text += text + "\n"
                
                # Extract image content for OCR
                image_list = page.get_images(full=True)
                for img in image_list:
                    try:
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        result, _ = ocr_engine(image_bytes)
                        if result:
                            # result is a list of tuples: (box, text, confidence)
                            ocr_text = " ".join([item[1] for item in result if item[1]])
                            if ocr_text.strip():
                                extracted_text += f"\n[Image Extract]: {ocr_text}\n"
                    except Exception:
                        pass
            if extracted_text.strip():
                return extracted_text.strip()
        except Exception as e:
            print(f"pdf extraction notice: {e}")

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

    # 4. Image Files (Native OCR)
    if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
        try:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            result, _ = ocr_engine(img_bytes)
            if result:
                ocr_text = " ".join([item[1] for item in result if item[1]])
                if ocr_text.strip():
                    return f"[Image OCR Extract]: {ocr_text}"
        except Exception as e:
            print(f"image extraction notice: {e}")

    # Fallback: Read raw bytes as string ONLY for unknown raw text extensions (Not PDFs/Images)
    if ext not in [".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".docx", ".doc"]:
        try:
            with open(file_path, "rb") as f:
                content = f.read()
                text = content.decode("utf-8", errors="ignore")
                cleaned = "".join(c for c in text if c.isprintable() or c in "\n\r\t")
                if len(cleaned.strip()) > 20:
                    return cleaned
        except Exception:
            pass

    return f"Document File: {os.path.basename(file_path)}\nUploaded to Knowledge Hub."