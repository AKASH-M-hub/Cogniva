import os
import shutil
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataWipe")

def execute_data_wipe():
    logger.info("Executing comprehensive data wipe as requested...")
    deleted_files = 0
    deleted_vectors = 0
    deleted_docs = 0

    # 1. Clear physical uploads in backend/uploads
    backend_dir = os.path.abspath(os.path.dirname(__file__))
    uploads_dir = os.path.join(backend_dir, "uploads")
    if os.path.exists(uploads_dir):
        for filename in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                    deleted_files += 1
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                    deleted_files += 1
            except Exception as e:
                logger.warning(f"Could not delete {file_path}: {e}")

    # 2. Clear ChromaDB persistent vector collection
    try:
        from app.services.vector_service import collection
        data = collection.get()
        if data and "ids" in data and len(data["ids"]) > 0:
            deleted_vectors = len(data["ids"])
            collection.delete(ids=data["ids"])
            logger.info(f"Cleared {deleted_vectors} vectors from ChromaDB collection.")
    except Exception as c_err:
        logger.warning(f"ChromaDB clear notice: {c_err}")

    # 3. Clear PostgreSQL/SQLite database tables
    try:
        from app.database.postgres import SessionLocal
        from app.models.memory import Memory
        from app.models.document import Document, DocumentChunk
        from app.models.audit_log import AuditLog

        db = SessionLocal()
        try:
            db.query(DocumentChunk).delete()
            deleted_docs = db.query(Document).delete()
            db.query(Memory).delete()
            db.query(AuditLog).delete()
            db.commit()
            logger.info(f"Cleared database tables: {deleted_docs} documents removed.")
        except Exception as db_e:
            db.rollback()
            logger.warning(f"DB clear notice: {db_e}")
        finally:
            db.close()
    except Exception as pg_err:
        logger.warning(f"Database connection notice: {pg_err}")

    logger.info(f"Data wipe completed: {deleted_files} files, {deleted_vectors} vectors, {deleted_docs} docs cleared.")
    return {
        "deleted_files": deleted_files,
        "deleted_vectors": deleted_vectors,
        "deleted_docs": deleted_docs
    }

if __name__ == "__main__":
    execute_data_wipe()
