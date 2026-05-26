def test_health_reports_provider_status(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "ai-service"
    assert "providers" in body
    for key in ("anthropic", "openai", "pinecone"):
        assert key in body["providers"]
        assert isinstance(body["providers"][key], bool)
