"""POST /guest-brief — staff-facing AI brief on an arriving guest."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.llm import generate_brief


router = APIRouter()


class BriefRequest(BaseModel):
    guest: dict
    recent_stays: list[dict] = Field(default_factory=list)
    recent_feedback: list[dict] = Field(default_factory=list)
    preferences: dict = Field(default_factory=dict)


class BriefResponse(BaseModel):
    brief: str


def _build_prompt(req: BriefRequest) -> str:
    guest = req.guest
    return (
        "Generate a brief 2-paragraph staff briefing for this hotel guest. "
        "Be specific, actionable, and warm. Focus on what staff need to know to deliver a great experience.\n\n"
        f"Guest: {guest.get('full_name')}\n"
        f"Tier: {guest.get('loyalty_tier', 'bronze')} ({guest.get('total_stays', 0)} stays)\n"
        f"Dietary: {guest.get('dietary_flags', [])}\n"
        f"Recent feedback: {req.recent_feedback[:3]}\n"
        f"Preferences: {req.preferences}\n\n"
        "Write 2 short paragraphs. First: who they are and what they value. "
        "Second: specific things staff should do."
    )


@router.post("/guest-brief", response_model=BriefResponse)
async def generate_guest_brief(request: BriefRequest) -> BriefResponse:
    brief = generate_brief(_build_prompt(request))
    return BriefResponse(brief=brief)
