"""
Cogniva Resilient, Ultra-Low Memory Embedding Service.
Optimized for 512MB RAM cloud environments (Render Free Tier).
Provides tiered embeddings:
1. FastEmbed (ONNX Runtime CPU, ~40MB RAM)
2. LightweightEmbedder (Zero-RAM subword semantic hasher, 384 dimensions, L2 normalized)
"""

import hashlib
import math
import re
from typing import List, Union


class EmbeddingResult(list):
    """Wrapper around list that provides a .tolist() method for compatibility."""
    def tolist(self):
        return list(self)


class LightweightEmbedder:
    """
    Zero-RAM, zero-dependency semantic embedding generator.
    Produces 384-dimensional unit-norm dense vectors.
    Captures word frequency, morphology, and subword n-grams.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _embed_single(self, text: str) -> List[float]:
        vec = [0.0] * self.dim
        if not text:
            return vec

        cleaned = text.lower().strip()
        words = re.findall(r'\b[A-Za-z0-9_\-\.]+\b', cleaned)
        if not words:
            return vec

        for word in words:
            # Word token hash
            w_weight = 1.0 + math.log(max(1, len(word)))
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dim
            sign = 1.0 if ((h >> 8) & 1) == 0 else -1.0
            vec[idx] += sign * w_weight

            # Subwords (char 3-grams and 4-grams)
            if len(word) >= 3:
                for n in (3, 4):
                    if len(word) >= n:
                        for i in range(len(word) - n + 1):
                            ngram = word[i:i+n]
                            ng_h = int(hashlib.sha256(ngram.encode('utf-8')).hexdigest(), 16)
                            ng_idx = ng_h % self.dim
                            ng_sign = 1.0 if ((ng_h >> 8) & 1) == 0 else -1.0
                            vec[ng_idx] += ng_sign * 0.35

        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [round(v / norm, 6) for v in vec]
        return vec

    def encode(self, texts: Union[str, List[str]]):
        if isinstance(texts, str):
            return EmbeddingResult(self._embed_single(texts))
        return EmbeddingResult([self._embed_single(t) for t in texts])


class FastEmbedWrapper:
    """Wrapper around Qdrant FastEmbed using ONNX Runtime (low memory)."""
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        from fastembed import TextEmbedding
        self.model = TextEmbedding(model_name=model_name)

    def encode(self, texts: Union[str, List[str]]):
        if isinstance(texts, str):
            embeddings = list(self.model.embed([texts]))
            return EmbeddingResult(embeddings[0].tolist())
        embeddings = list(self.model.embed(texts))
        return EmbeddingResult([e.tolist() for e in embeddings])


_cached_model = None

def get_embedding_model():
    """Returns the most capable, memory-safe embedding model available."""
    global _cached_model
    if _cached_model is not None:
        return _cached_model

    # 1. Try FastEmbed (low-memory ONNX Runtime)
    try:
        from fastembed import TextEmbedding
        _cached_model = FastEmbedWrapper()
        return _cached_model
    except Exception:
        pass

    # 2. Fallback to Zero-RAM LightweightEmbedder
    _cached_model = LightweightEmbedder(dim=384)
    return _cached_model
