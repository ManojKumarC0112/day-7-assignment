import time
import json
import logging
import httpx
from typing import AsyncGenerator, Optional, List, Dict, Any
from app.services.ai.base import AIProvider
from app.core.config import settings

logger = logging.getLogger("NOVA_AI")

class NvidiaProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.default_model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

    async def chat(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        target_model = model or self.default_model
        
        # Add system context if provided
        formatted_messages = []
        if context:
            formatted_messages.append({"role": "system", "content": context})
        formatted_messages.extend(messages)
        
        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "temperature": 0.7,
            "max_tokens": 2048,
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/chat/completions"
        start_time = time.perf_counter()
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                elapsed = time.perf_counter() - start_time
                
                choices = data.get("choices", [])
                text = ""
                if choices:
                    text = choices[0].get("message", {}).get("content", "")
                
                usage = data.get("usage", {})
                tokens = usage.get("completion_tokens", len(text) // 4)
                
                return {
                    "text": text,
                    "latency": round(elapsed, 2),
                    "tokens": tokens
                }
            except Exception as e:
                logger.error(f"NVIDIA Chat Error: {str(e)}")
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
        
        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "temperature": 0.7,
            "max_tokens": 2048,
            "stream": True
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/chat/completions"
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[len("data: "):].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_json = json.loads(data_str)
                                choices = chunk_json.get("choices", [])
                                if choices:
                                    content = choices[0].get("delta", {}).get("content", "")
                                    if content:
                                        yield content
                            except Exception:
                                pass
            except Exception as e:
                logger.error(f"NVIDIA Stream Error: {str(e)}")
                yield f"Error: {str(e)}"
