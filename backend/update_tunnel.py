import psycopg2
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    db_url = "postgresql://neondb_owner:npg_pavIj3crNwi5@ep-gentle-band-b30ou82i-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def register_tunnel_url(tunnel_url: str):
    tunnel_url = tunnel_url.strip().rstrip("/")
    if not tunnel_url.startswith("http"):
        print(f"Invalid tunnel URL: {tunnel_url}")
        return False
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS dynamic_tunnel (
            key VARCHAR(64) PRIMARY KEY,
            url TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        INSERT INTO dynamic_tunnel (key, url, updated_at)
        VALUES ('active_n8n', %s, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE
        SET url = EXCLUDED.url, updated_at = CURRENT_TIMESTAMP;
        """, (tunnel_url,))
        conn.commit()
        conn.close()
        print(f"[OK] Successfully registered active n8n tunnel in Neon DB: {tunnel_url}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to register tunnel URL: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        register_tunnel_url(sys.argv[1])
    else:
        print("Usage: python update_tunnel.py <tunnel_url>")
