from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()


class Settings:

    DATABASE_URL = os.getenv("DATABASE_URL")

    SECRET_KEY = os.getenv("SECRET_KEY")

    ALGORITHM = os.getenv("ALGORITHM")

    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    OLLAMA_URL = os.getenv("OLLAMA_URL", "https://akashhhhwqx-cogniva-ollama.hf.space")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    HF_SPACE = os.getenv("HF_SPACE", "Akashhhhwqx/cogniva-ollama")
    _cached_tunnel_url = None
    _cached_tunnel_time = 0

    @property
    def N8N_URL(self) -> str:
        import time
        now = time.time()
        if self._cached_tunnel_url and (now - self._cached_tunnel_time < 30):
            return self._cached_tunnel_url

        url = None
        if self.DATABASE_URL:
            try:
                import psycopg2
                conn = psycopg2.connect(self.DATABASE_URL)
                cur = conn.cursor()
                cur.execute("SELECT url FROM dynamic_tunnel WHERE key = 'active_n8n' LIMIT 1;")
                row = cur.fetchone()
                if row and row[0] and str(row[0]).startswith("http"):
                    url = str(row[0]).rstrip("/")
                conn.close()
            except Exception:
                pass

        if not url:
            url = os.getenv("N8N_URL", "http://localhost:5678").rstrip("/")

        self._cached_tunnel_url = url
        self._cached_tunnel_time = now
        return url

    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.60"))
    SEARCH_TOP_K = int(os.getenv("SEARCH_TOP_K", "5"))


settings = Settings()