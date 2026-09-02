import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.vector_service import store_embeddings
from app.services.pdf_service import extract_text

def chunk_text(text, chunk_size=1000, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def main():
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        print("Uploads directory not found.")
        return

    files = [f for f in os.listdir(uploads_dir) if os.path.isfile(os.path.join(uploads_dir, f))]
    print(f"Found {len(files)} files to embed.")
    
    for f in files:
        f_path = os.path.join(uploads_dir, f)
        print(f"Processing: {f_path}")
        try:
            content = extract_text(f_path)
            if not content or not content.strip():
                print(f"Skipping {f} (No text extracted)")
                continue
            
            chunks = chunk_text(content)
            num = store_embeddings(
                filename=f,
                chunks=chunks,
                department="General Enterprise",
                category="Document"
            )
            print(f"Successfully embedded {num} chunks for {f}")
        except Exception as e:
            print(f"Error embedding {f}: {e}")

if __name__ == "__main__":
    main()
