from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="Hotel OS AI Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# TODO(T-07): include routers for /classify, /respond, /embed, /guest-brief
