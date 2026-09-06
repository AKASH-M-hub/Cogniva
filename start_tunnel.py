import subprocess
import re
import time
import sys
import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_pavIj3crNwi5@ep-gentle-band-b30ou82i-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def update_neon_tunnel(url: str):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO dynamic_tunnel (key, url, updated_at)
            VALUES ('active_n8n', %s, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE
            SET url = EXCLUDED.url, updated_at = CURRENT_TIMESTAMP;
        """, (url,))
        conn.commit()
        conn.close()
        print(f"✅ Neon Database updated with active tunnel URL: {url}")
        print("🔗 Render Backend is now automatically routing to this tunnel!\n")
    except Exception as e:
        print(f"⚠️ Failed to update Neon DB: {e}")

def main():
    print("=====================================================")
    print("🚀 Cogniva Autonomous Tunnel Manager (Cloudflare)")
    print("=====================================================")
    print("Starting Cloudflare Tunnel to http://localhost:5678 ...")

    cmd = ["cloudflared.exe", "tunnel", "--url", "http://localhost:5678"]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    for line in proc.stdout:
        print(line, end="")
        if not tunnel_url:
            match = url_pattern.search(line)
            if match:
                tunnel_url = match.group(0)
                print("\n" + "="*55)
                print(f"🎉 TUNNEL ACTIVE: {tunnel_url}")
                print("="*55)
                update_neon_tunnel(tunnel_url)
                print("⚡ Cogniva n8n workflows are now connected to the Cloud!")
                print("💡 Press Ctrl+C to stop the tunnel when done.\n")

    proc.wait()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Tunnel stopped cleanly.")
