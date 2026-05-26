"""POST /embed — ingest hotel knowledge base documents into Pinecone."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.rag import upsert_documents


router = APIRouter()


class EmbedRequest(BaseModel):
    property_id: str
    documents: list[dict] = Field(default_factory=list)


class EmbedResponse(BaseModel):
    success: bool
    documents_indexed: int


@router.post("/embed", response_model=EmbedResponse)
async def embed_documents(request: EmbedRequest) -> EmbedResponse:
    if not request.documents:
        raise HTTPException(status_code=400, detail="No documents provided")

    for doc in request.documents:
        if "id" not in doc or "text" not in doc:
            raise HTTPException(
                status_code=400, detail="Each document requires `id` and `text` fields"
            )

    count = upsert_documents(request.documents, request.property_id)
    return EmbedResponse(success=True, documents_indexed=count)
