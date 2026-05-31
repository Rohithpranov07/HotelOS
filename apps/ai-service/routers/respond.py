"""POST /respond — RAG-augmented concierge response with action extraction."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.llm import generate_response
from services.rag import retrieve_context
from services.sentiment import score_sentiment


router = APIRouter()


class RespondRequest(BaseModel):
    message: str
    reservation_id: str
    property_id: str
    session_id: str
    conversation_history: list[dict] = Field(default_factory=list)
    guest_profile: dict = Field(default_factory=dict)


class RespondResponse(BaseModel):
    response_text: str
    actions: list[dict]
    intent: str
    confidence: float
    sentiment_score: float
    needs_human: bool
    follow_up_suggestions: list[str]


def _follow_ups(actions: list[dict]) -> list[str]:
    suggestions: list[str] = []
    if actions:
        suggestions.append("Track my order")
    suggestions.extend([
        "What's the checkout time?",
        "Cab to Kodaikanal Lake",
        "What's open at the Oasis Bar?",
        "Bonfire on the lawn tonight",
    ])
    return suggestions[:3]


@router.post("/respond", response_model=RespondResponse)
async def generate_concierge_response(request: RespondRequest) -> RespondResponse:
    context_chunks = retrieve_context(
        query=request.message,
        property_id=request.property_id,
        top_k=5,
    )

    response_text, actions = generate_response(
        user_message=request.message,
        conversation_history=request.conversation_history,
        context_chunks=context_chunks,
        guest_profile=request.guest_profile,
        hotel_name=request.guest_profile.get("hotel_name", "Hotel"),
    )

    sentiment = score_sentiment(request.message)
    intent = "ORDER" if actions else "INQUIRY"

    return RespondResponse(
        response_text=response_text,
        actions=actions,
        intent=intent,
        confidence=0.92,
        sentiment_score=sentiment,
        needs_human=False,
        follow_up_suggestions=_follow_ups(actions),
    )
