import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:AKASH2006@localhost:5432/postgres")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datname='cogniva_db';")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE cogniva_db;")
        print("Created cogniva_db in PostgreSQL successfully!")
    else:
        print("cogniva_db already exists in PostgreSQL!")
    conn.close()

    # Now populate tables into PostgreSQL
    from app.database.base import Base
    from sqlalchemy import create_engine
    import app.models

    pg_engine = create_engine("postgresql://postgres:AKASH2006@localhost:5432/cogniva_db")
    Base.metadata.create_all(bind=pg_engine)
    print("✅ All tables created in PostgreSQL cogniva_db!")

except Exception as e:
    print("PostgreSQL connection info/status:", e)
