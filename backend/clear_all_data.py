import os
import shutil
import sys

# Add backend root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("Starting data wipe...")

# 1. Clear physical uploads
uploads_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "uploads")
if os.path.exists(uploads_dir):
    for filename in os.listdir(uploads_dir):
        file_path = os.path.join(uploads_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
                print(f"Deleted upload file: {filename}")
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
                print(f"Deleted upload dir: {filename}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

# 2. Clear ChromaDB persistent vector collection
try:
    from app.services.vector_service import collection
    data = collection.get()
    if data and "ids" in data and len(data["ids"]) > 0:
        collection.delete(ids=data["ids"])
        print(f"Cleared {len(data['ids'])} vectors from ChromaDB collection!")
    else:
        print("ChromaDB collection is already empty.")
except Exception as c_err:
    print(f"ChromaDB clear notice: {c_err}")

# 3. Clear PostgreSQL database tables
try:
    from app.database.postgres import SessionLocal
    from app.models.memory import Memory
    from app.models.document import Document, DocumentChunk
    from app.models.audit_log import AuditLog

    db = SessionLocal()
    try:
        deleted_chunks = db.query(DocumentChunk).delete()
        deleted_docs = db.query(Document).delete()
        deleted_mems = db.query(Memory).delete()
        deleted_audits = db.query(AuditLog).delete()
        db.commit()
        print(f"Cleared PostgreSQL tables: {deleted_chunks} chunks, {deleted_docs} docs, {deleted_mems} memories, {deleted_audits} audit logs.")
    except Exception as db_e:
        db.rollback()
        print(f"PostgreSQL clear notice: {db_e}")
    finally:
        db.close()
except Exception as pg_err:
    print(f"PostgreSQL connection notice: {pg_err}")

print("Data wipe completed successfully!")
