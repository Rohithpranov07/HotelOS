"""Claude-backed concierge response generation.

The Anthropic client is constructed lazily so the service can boot without
``ANTHROPIC_API_KEY``. When the key is missing we return a deterministic
fallback response — useful for local dev, tests, and pre-launch demos.
"""

from __future__ import annotations

import json
import re
from typing import Any

from config import settings

HOTEL_PERSONA = """You are the AI concierge for {hotel_name}, a professional and warm hotel assistant.
You help guests with:
- Ordering food and beverages (create orders by outputting action JSON)
- Requesting services (housekeeping, laundry, amenities)
- Answering questions about the hotel, room, amenities, and local area
- Providing recommendations based on guest preferences

Always be warm, professional, and concise. Respond in the same language the guest uses.
If you create an order or service request, include it in the actions array.

For actions, output a JSON block at the END of your response (after your text):
ACTIONS: [{{"type": "create_order", "items": [...], "notes": "..."}}]

If you cannot help with something, offer to connect the guest with our team."""


_client: Any | None = None


def _get_client() -> Any | None:
    """Lazily build an Anthropic client; returns None when no key is set."""
    global _client
    if _client is not None:
        return _client
    if not settings.has_anthropic:
        return None
    from anthropic import Anthropic

    _client = Anthropic(api_key=settings.anthropic_api_key)
    return _client


_ACTIONS_RE = re.compile(r"ACTIONS:\s*(\[.*\])", re.DOTALL)


def _split_actions(text: str) -> tuple[str, list[dict]]:
    """Pull a trailing ``ACTIONS: [...]`` block off the response text."""
    match = _ACTIONS_RE.search(text)
    if not match:
        return text.strip(), []
    try:
        actions = json.loads(match.group(1))
        if not isinstance(actions, list):
            actions = []
    except json.JSONDecodeError:
        actions = []
    cleaned = _ACTIONS_RE.sub("", text).strip()
    return cleaned, actions


def _fallback_response(message: str, guest_profile: dict) -> tuple[str, list[dict]]:
    """Deterministic stand-in when the LLM isn't reachable."""
    name = guest_profile.get("full_name", "there")
    return (
        f"Hi {name}! I've noted your request: \"{message}\". "
        "Our team will follow up shortly. "
        "(LLM offline — using fallback response.)",
        [],
    )


def generate_response(
    user_message: str,
    conversation_history: list[dict],
    context_chunks: list[str],
    guest_profile: dict,
    hotel_name: str,
) -> tuple[str, list[dict]]:
    """Generate concierge response using Claude with RAG context.

    Returns ``(response_text, actions)``. Falls back to a canned reply if
    no Anthropic credential is configured.
    """
    client = _get_client()
    if client is None:
        return _fallback_response(user_message, guest_profile)

    system_prompt = HOTEL_PERSONA.format(hotel_name=hotel_name)
    context = "\n\n".join(context_chunks) if context_chunks else "No specific context available."
    guest_context = (
        f"Current guest: {guest_profile.get('full_name', 'Valued Guest')}\n"
        f"Loyalty tier: {guest_profile.get('loyalty_tier', 'bronze')}\n"
        f"Dietary preferences: {', '.join(guest_profile.get('dietary_flags', [])) or 'None specified'}\n"
        f"Room: {guest_profile.get('room_number', 'Not checked in')}\n"
    )

    messages = list(conversation_history) + [
        {
            "role": "user",
            "content": (
                f"Hotel knowledge base context:\n{context}\n\n"
                f"{guest_context}\n"
                f"Guest message: {user_message}"
            ),
        }
    ]

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    response_text = response.content[0].text
    return _split_actions(response_text)


def generate_brief(prompt: str) -> str:
    """Generate a short staff briefing. Falls back to a templated message."""
    client = _get_client()
    if client is None:
        return (
            "Briefing unavailable: LLM offline. Please review the guest profile "
            "and recent feedback manually."
        )
    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
