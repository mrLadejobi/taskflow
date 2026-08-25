"""Application configuration for TaskFlow.

Loads settings from environment variables and an optional `.env` file,
providing sane defaults for local development.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings.

    Attributes:
        app_name: Human-readable application name.
        debug: Enables verbose error output and auto-reload.
        database_url: SQLite connection string.
        secret_key: Secret used for signing JWT tokens.
        access_token_expire_minutes: JWT token lifetime in minutes.
        api_prefix: URL prefix under which all API routes live.
        cors_origins: List of allowed CORS origins.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "TaskFlow"
    debug: bool = True

    database_url: str = "sqlite:///./taskflow.db"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def sqlite_path(self) -> Path:
        """Return the filesystem path of the SQLite database file."""
        prefix = "sqlite:///"
        if not self.database_url.startswith(prefix):
            raise ValueError("Only SQLite databases are supported.")
        return Path(self.database_url[len(prefix):])


settings = Settings()
