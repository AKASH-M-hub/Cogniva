import os
import asyncio
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.file_record import FileRecord
from app.services.vector_service import initialize_vector_store
from app.services.pdf_service import extract_text
import time

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def main():
    db = next(get_db())
    records = db.query(FileRecord).all()
    print(f"Found {len(records)} records in PostgreSQL.")
    
    vector_store = initialize_vector_store()
    
    for record in records:
        file_path = os.path.join("uploads", record.filename)
        if not os.path.exists(file_path):
            print(f"Missing file: {file_path}, skipping.")
            continue
            
        print(f"Re-embedding {record.filename}...")
        try:
            # Re-extract with fixed extract_text
            content = extract_text(file_path)
            if not content.strip():
                print(f"Empty content for {file_path}")
                continue
                
            # Simulate what upload_service does
            vector_store.add_document(
                content=content,
                metadata={
                    "file_name": record.filename,
                    "department": record.department,
                    "category": record.category,
                    "uploader_role": "admin",
                }
            )
            print(f"Success: {record.filename}")
        except Exception as e:
            print(f"Failed to embed {record.filename}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
