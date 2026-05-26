"""POST /classify — keyword + sentiment-based intent classification.

Cheap, deterministic, and works without LLM credentials. Production
deployments can swap this for a fine-tuned classifier behind the same
response contract.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.sentiment import score_sentiment


router = APIRouter()


class ClassifyRequest(BaseModel):
    message: str
    conversation_history: list[dict] = Field(default_factory=list)
    guest_context: dict = Field(default_factory=dict)


class ClassifyResponse(BaseModel):
    intent: str
    confidence: float
    sentiment_score: float
    needs_human: bool
    sub_intent: str | None = None


# Ordered for tie-breaking: earlier wins on equal score.
INTENT_PATTERNS: dict[str, list[str]] = {
    "COMPLAINT": [
        "problem",
        "issue",
        "broken",
        "dirty",
        "noisy",
        "noise",
        "complaint",
        "terrible",
        "awful",
        "not working",
        "fix",
    ],
    "ESCALATE": ["speak to", "talk to", "human", "person", "manager", "supervisor", "real person"],
    # LAUNDRY listed before HOUSEKEEPING so "dry cleaning" wins over the overlap with "clean".
    "LAUNDRY": ["laundry", "dry cleaning", "wash", "iron", "ironing"],
    "HOUSEKEEPING": [
        "housekeeping",
        "cleaning",
        "clean",
        "towel",
        "sheets",
        "make up",
        "dnd",
        "do not disturb",
    ],
    "CHECKOUT": ["checkout", "check out", "bill", "invoice", "pay", "leaving"],
    "ORDER": [
        "order",
        "bring",
        "send",
        "want",
        "get me",
        "can i have",
        "room service",
        "food",
        "hungry",
        "eat",
        "drink",
        "coffee",
        "tea",
        "pizza",
        "burger",
    ],
    # INQUIRY is the catch-all factual-question bucket. ``what time`` is
    # intentionally absent because it overlaps with specific intents like
    # CHECKOUT ("what time is checkout?") — let those win when they match.
    "INQUIRY": [
        "where is",
        "how do i",
        "can you",
        "is there",
        "do you have",
        "what is",
        "wifi",
    ],
}


def _classify(message: str) -> tuple[str, float]:
    """Score by token count of matched keywords so multi-word phrases
    (``dry cleaning``) outrank a single overlapping word (``clean``)."""
    message_lower = message.lower()
    scores: dict[str, int] = {}
    for intent, keywords in INTENT_PATTERNS.items():
        score = sum(len(kw.split()) for kw in keywords if kw in message_lower)
        if score > 0:
            scores[intent] = score

    if not scores:
        return "CHITCHAT", 0.6

    detected = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    confidence = min(0.99, scores[detected] / max(total, 1) * 0.9 + 0.1)
    return detected, confidence


@router.post("/classify", response_model=ClassifyResponse)
async def classify_message(request: ClassifyRequest) -> ClassifyResponse:
    intent, confidence = _classify(request.message)
    sentiment = score_sentiment(request.message)
    needs_human = intent == "ESCALATE" or (intent == "COMPLAINT" and confidence > 0.8)
    return ClassifyResponse(
        intent=intent,
        confidence=confidence,
        sentiment_score=sentiment,
        needs_human=needs_human,
    )
