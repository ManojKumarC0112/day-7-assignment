from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nova AI API"
    VERSION: str = "1.0.0"
    GROQ_API_KEY: str
    DATABASE_URL: str = "sqlite:///./nova_ai.db"

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
