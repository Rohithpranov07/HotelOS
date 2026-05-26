"""POST /embed — validates input shape and graceful no-key behavior."""


def test_embed_rejects_empty_documents(client):
    res = client.post(
        "/api/v1/embed", json={"property_id": "p-1", "documents": []}
    )
    assert res.status_code == 400


def test_embed_rejects_documents_missing_required_fields(client):
    res = client.post(
        "/api/v1/embed",
        json={"property_id": "p-1", "documents": [{"id": "d1"}]},
    )
    assert res.status_code == 400


def test_embed_returns_zero_when_no_pinecone_configured(client):
    res = client.post(
        "/api/v1/embed",
        json={
            "property_id": "p-1",
            "documents": [{"id": "d1", "text": "Checkout is at 11:00", "category": "policy"}],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["documents_indexed"] == 0


def test_embed_calls_upsert_when_providers_present(client, monkeypatch):
    calls: dict = {}

    def fake_upsert(documents, property_id):
        calls["documents"] = documents
        calls["property_id"] = property_id
        return len(documents)

    monkeypatch.setattr("routers.embed.upsert_documents", fake_upsert)

    docs = [
        {"id": "d1", "text": "Pool closes at 22:00", "category": "policy"},
        {"id": "d2", "text": "Breakfast 7-10am"},
    ]
    res = client.post("/api/v1/embed", json={"property_id": "p-1", "documents": docs})
    assert res.status_code == 200
    assert res.json()["documents_indexed"] == 2
    assert calls["property_id"] == "p-1"
    assert len(calls["documents"]) == 2
