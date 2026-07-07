import logging
from app.services.ai.base import AIProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.groq import GroqProvider
from app.services.ai.nvidia import NvidiaProvider

logger = logging.getLogger("NOVA_AI")

class AIServiceFactory:
    _providers = {
        "gemini": GeminiProvider(),
        "groq": GroqProvider(),
        "nvidia": NvidiaProvider()
    }

    @classmethod
    def get_provider(cls, name: str) -> AIProvider:
        provider_key = str(name).lower().strip()
        if provider_key not in cls._providers:
            logger.warning(f"Requested unknown provider '{name}', falling back to groq")
            return cls._providers["groq"]
        return cls._providers[provider_key]
