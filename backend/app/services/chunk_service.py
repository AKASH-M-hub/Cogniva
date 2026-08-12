def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 100):
    """Pure Python text chunker with overlap and separator splitting."""
    if not text or not text.strip():
        return []

    separators = ["\n\n", "\n", ". ", " ", ""]
    
    def _split(t, seps):
        if not seps or len(t) <= chunk_size:
            return [t]
        
        sep = seps[0]
        splits = t.split(sep) if sep else list(t)
        chunks = []
        current = ""

        for s in splits:
            item = s + sep if sep else s
            if len(current) + len(item) <= chunk_size:
                current += item
            else:
                if current:
                    chunks.append(current.strip())
                if len(item) > chunk_size and len(seps) > 1:
                    chunks.extend(_split(item, seps[1:]))
                    current = ""
                else:
                    current = item
        if current.strip():
            chunks.append(current.strip())
        return chunks

    raw_chunks = _split(text, separators)
    
    # Apply overlap windowing if needed
    final_chunks = []
    for c in raw_chunks:
        if c.strip():
            final_chunks.append(c.strip())
            
    return final_chunks if final_chunks else [text[:chunk_size]]