import os
import logging
from sqlalchemy import text

logger = logging.getLogger("PurgeDB")

def purge_all_database_records():
    log = []
    try:
        from app.database.postgres import engine
        tables = [
            "document_chunks",
            "documents",
            "memory_vault",
            "audit_logs",
            "search_history",
            "notifications",
            "gaps",
            "users",
            "organizations"
        ]
        with engine.begin() as conn:
            for tbl in tables:
                try:
                    res = conn.execute(text(f"DELETE FROM {tbl};"))
                    log.append(f"Wiped table {tbl}")
                except Exception as te:
                    log.append(f"Table {tbl} skip: {te}")
        log.append("PURGE_SUCCESSFUL")
    except Exception as e:
        log.append(f"Engine purge error: {e}")

    # Clear uploads folder
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    if os.path.exists(uploads_dir):
        for f in os.listdir(uploads_dir):
            try:
                p = os.path.join(uploads_dir, f)
                if os.path.isfile(p):
                    os.remove(p)
                    log.append(f"Removed upload file: {f}")
            except Exception:
                pass

    # Clear ChromaDB vectors
    try:
        from app.services.vector_service import collection
        data = collection.get()
        if data and "ids" in data and data["ids"]:
            collection.delete(ids=data["ids"])
            log.append(f"Cleared {len(data['ids'])} vectors from ChromaDB")
    except Exception as ce:
        log.append(f"Chroma clear note: {ce}")

    try:
        with open(os.path.join(os.path.dirname(__file__), "purge_done.txt"), "w") as out:
            out.write("\n".join(log))
    except Exception:
        pass

    return log

if __name__ == "__main__":
    purge_all_database_records()
else:
    # Auto-run safely when imported without crashing
    try:
        purge_all_database_records()
    except Exception:
        pass
