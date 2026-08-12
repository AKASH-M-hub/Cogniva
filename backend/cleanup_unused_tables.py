import psycopg2
from sqlalchemy import create_engine, text

# Drop list of unused legacy tables
UNUSED_TABLES = [
    "agents",
    "analytics",
    "audit_logs",
    "decision_analytics_summary",
    "decision_logs",
    "departments",
    "enterprise_decisions",
    "memory_analytics",
    "memory_vault",
    "notifications",
    "orchestration_analytics",
    "orchestration_logs",
    "pinned_memories",
    "recent_context"
]

def cleanup_postgresql():
    print("🧹 Cleaning up unused legacy tables in PostgreSQL cogniva_db...")
    try:
        conn = psycopg2.connect("postgresql://postgres:AKASH2006@localhost:5432/cogniva_db")
        conn.autocommit = True
        cur = conn.cursor()
        
        for table in UNUSED_TABLES:
            cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"  - Dropped unused table: {table}")
            
        cur.close()
        conn.close()
        print("✅ PostgreSQL table cleanup complete!")
    except Exception as e:
        print(f"⚠️ PostgreSQL cleanup notice: {e}")

def cleanup_sqlite():
    print("🧹 Cleaning up unused legacy tables in local SQLite cogniva.db...")
    try:
        sqlite_engine = create_engine("sqlite:///./cogniva.db")
        with sqlite_engine.connect() as conn:
            for table in UNUSED_TABLES:
                conn.execute(text(f"DROP TABLE IF EXISTS {table};"))
                print(f"  - Dropped unused table: {table}")
            conn.commit()
        print("✅ SQLite table cleanup complete!")
    except Exception as e:
        print(f"⚠️ SQLite cleanup notice: {e}")

if __name__ == "__main__":
    cleanup_postgresql()
    cleanup_sqlite()
