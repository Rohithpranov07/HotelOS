"""POST /guest-brief — covers fallback and mocked-LLM behavior."""


def test_brief_returns_fallback_without_llm_key(client):
    res = client.post(
        "/api/v1/guest-brief",
        json={
            "guest": {"full_name": "Ada Lovelace", "loyalty_tier": "gold", "total_stays": 4},
            "recent_feedback": [],
            "preferences": {"pillow_type": "soft"},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert "brief" in body
    assert isinstance(body["brief"], str)
    assert len(body["brief"]) > 0


def test_brief_uses_llm_when_available(client, monkeypatch):
    monkeypatch.setattr(
        "routers.brief.generate_brief",
        lambda prompt: "Para 1. " + prompt[:40] + "\n\nPara 2. Be warm.",
    )
    res = client.post(
        "/api/v1/guest-brief",
        json={
            "guest": {"full_name": "Bob", "loyalty_tier": "silver"},
        },
    )
    body = res.json()
    assert body["brief"].startswith("Para 1.")
