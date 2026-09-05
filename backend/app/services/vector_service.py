import chromadb

client = chromadb.PersistentClient(
    path="chroma_db"
)

collection = client.get_or_create_collection(
    name="knowledge_base"
)

from app.services.embedding_service import get_embedding_model

def get_model():
    return get_embedding_model()


def store_embeddings(filename, chunks, department="Engineering", document_id=None, category="General", timestamp=None, org_id=None, user_id=None):
    """
    Stores vector embeddings into ChromaDBPersistentClient.
    Pairs semantic vectors with rich metadata linked to PostgreSQL tables and multi-tenant organization.
    """
    if not chunks:
        return 0

    import datetime
    if not timestamp:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    model = get_model()
    embeddings = model.encode(chunks).tolist()

    ids = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{filename}_chunk_{i}"
        ids.append(chunk_id)
        documents.append(chunk)
        metadatas.append({
            "source": filename,
            "filename": filename,
            "chunk_index": i,
            "department": department,
            "category": category,
            "document_id": str(document_id) if document_id else "N/A",
            "org_id": str(org_id) if org_id is not None else "",
            "user_id": str(user_id) if user_id is not None else "",
            "timestamp": timestamp
        })

    # Use upsert to update existing embeddings without ID conflicts
    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return len(chunks)