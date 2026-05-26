"""POST /respond — covers fallback behavior when no LLM key is configured."""


def test_respond_returns_full_shape_without_llm_key(client):
    res = client.post(
        "/api/v1/respond",
        json={
            "message": "Can you bring me a coffee?",
            "reservation_id": "r-1",
            "property_id": "p-1",
            "session_id": "s-1",
            "guest_profile": {"full_name": "Ada", "hotel_name": "Test Hotel"},
        },
    )
    assert res.status_code == 200
    body = res.json()
    for field in (
        "response_text",
        "actions",
        "intent",
        "confidence",
        "sentiment_score",
        "needs_human",
        "follow_up_suggestions",
    ):
        assert field in body
    assert isinstance(body["actions"], list)
    assert isinstance(body["follow_up_suggestions"], list)
    assert len(body["follow_up_suggestions"]) <= 3
    # Fallback should still address the guest by name.
    assert "Ada" in body["response_text"]


def test_respond_intent_is_inquiry_when_no_actions(client):
    res = client.post(
        "/api/v1/respond",
        json={
            "message": "What's the wifi password?",
            "reservation_id": "r-2",
            "property_id": "p-1",
            "session_id": "s-2",
        },
    )
    assert res.json()["intent"] == "INQUIRY"


def test_respond_with_mocked_llm_returns_actions(client, monkeypatch):
    """When the LLM yields an ACTIONS block, /respond surfaces it as ORDER intent."""

    def fake_generate_response(**_kwargs):
        return (
            "Sure, one coffee on the way.",
            [{"type": "create_order", "items": [{"name": "Coffee", "qty": 1}]}],
        )

    monkeypatch.setattr("routers.respond.generate_response", fake_generate_response)

    res = client.post(
        "/api/v1/respond",
        json={
            "message": "Bring me a coffee",
            "reservation_id": "r-3",
            "property_id": "p-1",
            "session_id": "s-3",
        },
    )
    body = res.json()
    assert body["intent"] == "ORDER"
    assert body["actions"][0]["type"] == "create_order"
    assert "Track my order" in body["follow_up_suggestions"]
