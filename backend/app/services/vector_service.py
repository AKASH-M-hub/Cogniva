import chromadb

from sentence_transformers import SentenceTransformer


client = chromadb.PersistentClient(
    path="chroma_db"
)

collection = client.get_or_create_collection(
    name="knowledge_base"
)

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def store_embeddings(filename, chunks):

    embeddings = model.encode(chunks).tolist()

    ids = []

    documents = []

    metadatas = []

    for i, chunk in enumerate(chunks):

        ids.append(f"{filename}_{i}")

        documents.append(chunk)

        metadatas.append(
            {
                "source": filename,
                "chunk": i
            }
        )

    collection.add(

        ids=ids,

        documents=documents,

        embeddings=embeddings,

        metadatas=metadatas

    )

    return len(chunks)