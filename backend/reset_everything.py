import os
import shutil
import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FullReset")

def perform_complete_reset():
    logger.info("=== STARTING FULL COGNIVA RESET (CREDENTIALS + DOCUMENTS + VECTORS) ===")
    
    current_dir = os.path.abspath(os.path.dirname(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, ".."))

    # 1. Clean SQLite cogniva.db
    db_path = os.path.join(current_dir, "cogniva.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # List all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]
            logger.info(f"Found SQLite tables: {tables}")
            
            for t in tables:
                try:
                    cursor.execute(f"DELETE FROM \"{t}\";")
                    logger.info(f"Wiped all rows from table: {t}")
                except Exception as te:
                    logger.warning(f"Error wiping table {t}: {te}")
            
            conn.commit()
            cursor.execute("VACUUM;")
            conn.close()
            logger.info("SQLite cogniva.db completely purged and vacuumed!")
        except Exception as sqle:
            logger.error(f"SQLite reset error: {sqle}")

    # 2. Also try PostgreSQL if available
    try:
        from app.database.postgres import primary_url
        from sqlalchemy import create_engine, text
        if primary_url and primary_url.startswith("postgresql"):
            pg_engine = create_engine(primary_url, connect_args={"connect_timeout": 2})
            with pg_engine.begin() as pg_conn:
                for tbl in ["document_chunks", "documents", "memory_vault", "audit_logs", "search_history", "notifications", "gaps", "users", "organizations"]:
                    try:
                        pg_conn.execute(text(f"TRUNCATE TABLE {tbl} CASCADE;"))
                    except Exception:
                        try:
                            pg_conn.execute(text(f"DELETE FROM {tbl};"))
                        except Exception:
                            pass
            logger.info("PostgreSQL tables wiped successfully.")
    except Exception as pge:
        logger.info(f"PostgreSQL skip notice: {pge}")

    # 3. Clear all physical upload folders
    upload_dirs = [
        os.path.join(current_dir, "uploads"),
        os.path.join(root_dir, "uploads")
    ]
    for u_dir in upload_dirs:
        if os.path.exists(u_dir):
            for fname in os.listdir(u_dir):
                fpath = os.path.join(u_dir, fname)
                try:
                    if os.path.isfile(fpath) or os.path.islink(fpath):
                        os.unlink(fpath)
                    elif os.path.isdir(fpath):
                        shutil.rmtree(fpath)
                except Exception as fe:
                    logger.warning(f"File delete notice: {fe}")
            logger.info(f"Cleaned upload folder: {u_dir}")

    # 4. Clear ChromaDB vector stores
    chroma_dirs = [
        os.path.join(current_dir, "chroma_db"),
        os.path.join(root_dir, "chroma_data")
    ]
    try:
        from app.services.vector_service import collection
        all_vecs = collection.get()
        if all_vecs and "ids" in all_vecs and len(all_vecs["ids"]) > 0:
            collection.delete(ids=all_vecs["ids"])
            logger.info(f"Deleted {len(all_vecs['ids'])} vectors via Chroma API.")
    except Exception as ce:
        logger.warning(f"Chroma client vector delete notice: {ce}")

    # 5. Clear in-memory security caches if any
    try:
        from app.utils.security import _PASSWORD_VERIFY_CACHE
        _PASSWORD_VERIFY_CACHE.clear()
    except Exception:
        pass

    logger.info("=== FULL COGNIVA RESET COMPLETED SUCCESSFULLY ===")
    return {"success": True, "message": "All credentials, documents, and vectors wiped completely."}

if __name__ == "__main__":
    perform_complete_reset()
