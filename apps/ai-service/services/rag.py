"""RAG retrieval and ingestion against Pinecone with OpenAI embeddings.

Both providers are optional: when keys are missing, ``retrieve_context``
returns an empty list and ``upsert_documents`` returns 0 — the rest of
the stack stays functional with a degraded knowledge base.
"""

from __future__ import annotations

from typing import Any

from config import settings


_pinecone_client: Any | None = None
_openai_client: Any | None = None


def _get_openai() -> Any | None:
    global _openai_client
    if _openai_client is not None:
        return _openai_client
    if not settings.has_openai:
        return None
    from openai import OpenAI

    _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_pinecone() -> Any | None:
    global _pinecone_client
    if _pinecone_client is not None:
        return _pinecone_client
    if not settings.has_pinecone:
        return None
    from pinecone import Pinecone

    _pinecone_client = Pinecone(api_key=settings.pinecone_api_key)
    return _pinecone_client


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings. Returns [] when OpenAI is not configured."""
    client = _get_openai()
    if client is None or not texts:
        return []
    response = client.embeddings.create(model=settings.embedding_model, input=texts)
    return [item.embedding for item in response.data]


def retrieve_context(
    query: str,
    property_id: str,
    top_k: int = 5,
    min_score: float = 0.75,
) -> list[str]:
    """Retrieve relevant hotel knowledge chunks from Pinecone.

    Returns ``[]`` when either OpenAI or Pinecone is not configured so the
    concierge falls back to its no-context reply.
    """
    pc = _get_pinecone()
    if pc is None:
        return []
    embeddings = get_embeddings([query])
    if not embeddings:
        return []

    index = pc.Index(settings.pinecone_index_name)
    results = index.query(
        vector=embeddings[0],
        top_k=top_k,
        filter={"property_id": property_id},
        include_metadata=True,
    )
    return [
        match.metadata["text"]
        for match in results.matches
        if match.score >= min_score and match.metadata.get("text")
    ]


def upsert_documents(documents: list[dict], property_id: str) -> int:
    """Ingest documents into Pinecone. Each doc: { id, text, category }.

    Returns the number of vectors written, or 0 when providers are absent.
    """
    if not documents:
        return 0
    pc = _get_pinecone()
    if pc is None:
        return 0
    texts = [doc["text"] for doc in documents]
    embeddings = get_embeddings(texts)
    if not embeddings:
        return 0

    vectors = [
        {
            "id": f"{property_id}_{doc['id']}",
            "values": embedding,
            "metadata": {
                "text": doc["text"],
                "category": doc.get("category", "general"),
                "property_id": property_id,
            },
        }
        for doc, embedding in zip(documents, embeddings, strict=True)
    ]

    index = pc.Index(settings.pinecone_index_name)
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i : i + batch_size])
    return len(vectors)
