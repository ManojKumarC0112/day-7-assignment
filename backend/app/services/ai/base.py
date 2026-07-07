from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List, Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def chat(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends chat messages to the model.
        Returns Dict with keys:
          - "text": Completed response string
          - "latency": Time taken in seconds (float)
          - "tokens": Estimated generated tokens count (int)
        """
        pass

    @abstractmethod
    async def stream(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens as they occur.
        """
        pass
