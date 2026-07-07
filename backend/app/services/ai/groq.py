import time
import logging
from typing import AsyncGenerator, Optional, List, Dict, Any
from groq import AsyncGroq
from app.services.ai.base import AIProvider
from app.core.config import settings

logger = logging.getLogger("NOVA_AI")

class GroqProvider(AIProvider):
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.default_model = "llama-3.3-70b-versatile"

    async def chat(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        target_model = model or self.default_model
        formatted_messages = []
        if context:
            formatted_messages.append({"role": "system", "content": context})
        formatted_messages.extend(messages)

        start_time = time.perf_counter()
        try:
            response = await self.client.chat.completions.create(
                messages=formatted_messages,
                model=target_model,
                temperature=0.7,
                max_tokens=2048,
            )
            elapsed = time.perf_counter() - start_time
            text = response.choices[0].message.content
            
            tokens = len(text) // 4
            if response.usage and hasattr(response.usage, 'completion_tokens') and response.usage.completion_tokens:
                tokens = response.usage.completion_tokens
                
            return {
                "text": text,
                "latency": round(elapsed, 2),
                "tokens": tokens
            }
        except Exception as e:
            logger.error(f"Groq Chat Error: {str(e)}")
            raise e

    async def stream(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        target_model = model or self.default_model
        formatted_messages = []
        if context:
            formatted_messages.append({"role": "system", "content": context})
        formatted_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                messages=formatted_messages,
                model=target_model,
                temperature=0.7,
                max_tokens=2048,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Groq Stream Error: {str(e)}")
            yield f"Error: {str(e)}"
