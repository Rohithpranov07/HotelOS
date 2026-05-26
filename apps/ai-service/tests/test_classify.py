"""Acceptance tests for POST /classify."""

import pytest


@pytest.mark.parametrize(
    "message,expected_intent",
    [
        ("Please order a pizza to room 301", "ORDER"),
        ("Can I have some coffee?", "ORDER"),
        ("My AC is broken", "COMPLAINT"),
        ("The room is dirty", "COMPLAINT"),
        ("What time is checkout?", "CHECKOUT"),
        ("Where is the spa?", "INQUIRY"),
        ("I want to speak to a manager", "ESCALATE"),
        ("Please send fresh towels", "HOUSEKEEPING"),
        ("Can you do dry cleaning today?", "LAUNDRY"),
    ],
)
def test_classify_intents(client, message, expected_intent):
    res = client.post("/api/v1/classify", json={"message": message})
    assert res.status_code == 200
    body = res.json()
    assert body["intent"] == expected_intent
    assert 0.0 <= body["confidence"] <= 1.0
    assert 0.0 <= body["sentiment_score"] <= 1.0


def test_classify_escalate_sets_needs_human(client):
    res = client.post("/api/v1/classify", json={"message": "I need to talk to a human"})
    body = res.json()
    assert body["needs_human"] is True


def test_classify_chitchat_when_no_keywords_match(client):
    res = client.post("/api/v1/classify", json={"message": "Hello there"})
    body = res.json()
    assert body["intent"] == "CHITCHAT"
    assert body["needs_human"] is False


def test_classify_sentiment_for_negative_message(client):
    res = client.post("/api/v1/classify", json={"message": "The room is terrible and dirty"})
    assert res.json()["sentiment_score"] < 0.5


def test_classify_sentiment_for_positive_message(client):
    res = client.post("/api/v1/classify", json={"message": "The room is wonderful and clean!"})
    assert res.json()["sentiment_score"] > 0.5
