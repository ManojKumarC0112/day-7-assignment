from abc import ABC, abstractmethod
from typing import AsyncGenerator, Iterator, Optional, Any

class AIService(ABC):
    @abstractmethod
    def generate_chat_response(self, messages: list[dict], model: str) -> str:
        pass

    @abstractmethod
    def stream_chat_response(self, messages: list[dict], model: str) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    def generate_title(self, prompt: str) -> str:
        pass
