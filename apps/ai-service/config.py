"""Service configuration.

All third-party API keys are optional. When absent, the corresponding
features degrade gracefully (sentiment-only classification, canned
concierge responses, no-op embeddings) so the service still boots in dev
and tests without secrets.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Optional third-party credentials — provided later in deploy.
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    pinecone_api_key: str | None = None
    pinecone_index_name: str = "hotel-knowledge-base"

    redis_url: str = "redis://localhost:6379"
    environment: str = "development"

    # Model selection — easy to swap when migrating to newer Claude versions.
    claude_model: str = "claude-3-5-sonnet-20241022"
    embedding_model: str = "text-embedding-3-small"

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_pinecone(self) -> bool:
        return bool(self.pinecone_api_key)


settings = Settings()
