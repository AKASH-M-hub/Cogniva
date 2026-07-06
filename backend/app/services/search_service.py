import chromadb
from sentence_transformers import SentenceTransformer

client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_or_create_collection(
    name="knowledge_base"
)

model = None


def get_model():
    global model
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model


def search_documents(question: str):

    model = get_model()

    embedding = model.encode(question).tolist()

    results = collection.query(
        query_embeddings=[embedding],
        n_results=5
    )

    docs = results.get("documents", [])

    if not docs or len(docs[0]) == 0:
        return ""

    return "\n\n".join(docs[0])