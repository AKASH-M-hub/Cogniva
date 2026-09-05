import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "cogniva.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]

results = {}
for t in tables:
    cursor.execute(f"SELECT COUNT(*) FROM \"{t}\";")
    results[t] = cursor.fetchone()[0]

conn.close()

with open(os.path.join(os.path.dirname(__file__), "counts_result.txt"), "w") as f:
    for t, c in results.items():
        f.write(f"{t}: {c}\n")
