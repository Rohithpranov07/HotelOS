"""Hotel OS AI service entrypoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI

from config import settings
from routers import brief, classify, embed, respond


app = FastAPI(title="Hotel OS AI Service", version="1.0.0")

app.include_router(classify.router, prefix="/api/v1")
app.include_router(respond.router, prefix="/api/v1")
app.include_router(embed.router, prefix="/api/v1")
app.include_router(brief.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "providers": {
            "anthropic": settings.has_anthropic,
            "openai": settings.has_openai,
            "pinecone": settings.has_pinecone,
        },
    }
