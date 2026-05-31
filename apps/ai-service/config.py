"""Service configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Claude (primary LLM — wire up when ready)
    anthropic_api_key: str | None = None
    claude_model: str = "claude-sonnet-4-6"

    # Optional — for RAG embeddings (if added later)
    openai_api_key: str | None = None
    pinecone_api_key: str | None = None
    pinecone_index_name: str = "hotel-knowledge-base"
    embedding_model: str = "text-embedding-3-small"

    redis_url: str = "redis://localhost:6379"
    environment: str = "development"

    @property
    def has_claude(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_pinecone(self) -> bool:
        return bool(self.pinecone_api_key)


settings = Settings()
