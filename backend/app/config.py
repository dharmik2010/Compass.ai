from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "AI Travel Planner"
    debug: bool = True

    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/travel_planner"
    redis_url: str = "redis://localhost:6379/0"

    amadeus_api_key: Optional[str] = None
    amadeus_api_secret: Optional[str] = None
    amadeus_environment: str = "test"

    expedia_api_key: Optional[str] = None
    viator_api_key: Optional[str] = None
    traxo_api_key: Optional[str] = None

    google_maps_api_key: Optional[str] = None
    meteomatics_api_key: Optional[str] = None
    meteomatics_api_secret: Optional[str] = None

    jwt_secret: str = "super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    email_domain: str = "trips.platform.io"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
