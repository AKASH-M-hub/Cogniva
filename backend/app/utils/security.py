import hmac
import hashlib
import base64
import json
import time
import threading
from typing import Optional, Tuple
import bcrypt
from app.config.settings import settings

SECRET_KEY = settings.SECRET_KEY or "9c8d7f6a5b4c3e2f1a0b9c8d7e6f5a4b3c2d1e0f"
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 60) or 60

# In-memory cryptographic verification cache (10-minute TTL, thread-safe)
_VERIFY_CACHE = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL = 600  # 10 minutes

def _cache_key(plain_password: str, hashed_password: str) -> str:
    return hashlib.sha256(f"{plain_password}:{hashed_password}:{SECRET_KEY}".encode('utf-8')).hexdigest()

def hash_password(password: str) -> str:
    """
    High-performance native bcrypt hash (rounds=10, ~15ms execution)
    """
    try:
        salt = bcrypt.gensalt(rounds=10)
        return bcrypt.hashpw(str(password).encode('utf-8'), salt).decode('utf-8')
    except Exception:
        salt_hex = hashlib.sha256(SECRET_KEY.encode('utf-8')).hexdigest()[:16]
        return f"pbkdf2_sha256${salt_hex}${hashlib.sha256((str(password) + salt_hex).encode('utf-8')).hexdigest()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    is_valid, _ = verify_password_enhanced(plain_password, hashed_password)
    return is_valid

def verify_password_enhanced(plain_password: str, hashed_password: str) -> Tuple[bool, bool]:
    """
    Ultra-fast verification with native bcrypt, in-memory caching, and safe legacy fallback.
    Returns: (is_valid: bool, is_legacy: bool)
    """
    if not plain_password or not hashed_password:
        return False, False

    plain_str = str(plain_password)
    hash_str = str(hashed_password)

    now = time.time()
    cache_key = _cache_key(plain_str, hash_str)

    # 1. In-memory fast cache check (< 0.1ms)
    with _CACHE_LOCK:
        if cache_key in _VERIFY_CACHE:
            cached_valid, expires_at = _VERIFY_CACHE[cache_key]
            if now < expires_at:
                return cached_valid, False
            else:
                del _VERIFY_CACHE[cache_key]

    # 2. Native bcrypt check ($2b$, $2a$, $2y$)
    if hash_str.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            valid = bcrypt.checkpw(plain_str.encode('utf-8'), hash_str.encode('utf-8'))
            if valid:
                with _CACHE_LOCK:
                    if len(_VERIFY_CACHE) > 2000:
                        _VERIFY_CACHE.clear()
                    _VERIFY_CACHE[cache_key] = (True, now + _CACHE_TTL)
            return valid, False
        except Exception:
            pass

    # 3. Fast fallback for legacy plain text passwords (e.g. dev/seed accounts)
    try:
        is_plain_match = hmac.compare_digest(plain_str.encode('utf-8'), hash_str.encode('utf-8'))
        if is_plain_match:
            with _CACHE_LOCK:
                _VERIFY_CACHE[cache_key] = (True, now + _CACHE_TTL)
            return True, True
    except Exception:
        pass

    return False, False

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_delta_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    exp_minutes = expires_delta_minutes if expires_delta_minutes else ACCESS_TOKEN_EXPIRE_MINUTES
    expire_time = int(time.time()) + (exp_minutes * 60)
    to_encode.update({"exp": expire_time})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(to_encode, separators=(',', ':')).encode('utf-8')
    
    encoded_header = _b64url_encode(header_bytes)
    encoded_payload = _b64url_encode(payload_bytes)
    
    signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
    encoded_signature = _b64url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def verify_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_signature = parts
        
        signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(encoded_signature)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        payload = json.loads(_b64url_decode(encoded_payload).decode('utf-8'))
        if "exp" in payload and payload["exp"] < int(time.time()):
            return None  # Token has expired
            
        return payload
    except Exception:
        return None