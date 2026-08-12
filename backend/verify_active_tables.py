import psycopg2

conn = psycopg2.connect("postgresql://postgres:AKASH2006@localhost:5432/cogniva_db")
cur = conn.cursor()
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print(f"Total Active PostgreSQL Tables ({len(tables)}):")
for t in tables:
    print(f"  - {t}")
cur.close()
conn.close()
