import time
import json
import logging
import httpx
from typing import AsyncGenerator, Optional, List, Dict, Any
from app.services.ai.base import AIProvider
from app.core.config import settings

logger = logging.getLogger("NOVA_AI")

class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.default_model = "gemini-2.5-flash"

    def _prepare_messages(self, messages: List[Dict[str, Any]], context: Optional[str] = None) -> List[Dict[str, Any]]:
        contents = []
        if context:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System context:\n{context}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "System context acknowledged. I will adapt accordingly."}]
            })
            
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            parts = []
            if isinstance(msg["content"], list):
                for part in msg["content"]:
                    if part.get("type") == "text":
                        parts.append({"text": part.get("text", "")})
                    elif part.get("type") == "image_url":
                        url_data = part.get("image_url", {}).get("url", "")
                        if url_data.startswith("data:"):
                            header, base64_data = url_data.split(";base64,")
                            mimeType = header.split("data:")[1]
                            parts.append({
                                "inlineData": {
                                    "mimeType": mimeType,
                                    "data": base64_data
                                }
                            })
            else:
                parts.append({"text": msg["content"]})
                
            contents.append({
                "role": role,
                "parts": parts
            })
        return contents

    async def chat(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        target_model = model or self.default_model
        contents = self._prepare_messages(messages, context)
        payload = {"contents": contents}
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.api_key}"
        
        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                elapsed = time.perf_counter() - start_time
                candidates = data.get("candidates", [])
                text = ""
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                
                # Extract token usage metadata
                usage = data.get("usageMetadata", {})
                tokens = usage.get("candidatesTokenCount", len(text) // 4)
                
                return {
                    "text": text,
                    "latency": round(elapsed, 2),
                    "tokens": tokens
                }
            except Exception as e:
                logger.error(f"Gemini Chat Error: {str(e)}")
                raise e

    async def stream(
        self, 
        messages: List[Dict[str, Any]], 
        model: str, 
        context: Optional[str] = None, 
        image_data: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        target_model = model or self.default_model
        contents = self._prepare_messages(messages, context)
        payload = {"contents": contents}
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:streamGenerateContent?alt=sse&key={self.api_key}"
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                data_str = line[len("data: "):].strip()
                                chunk_json = json.loads(data_str)
                                candidates = chunk_json.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    if parts:
                                        text_chunk = parts[0].get("text", "")
                                        if text_chunk:
                                            yield text_chunk
                            except Exception:
                                pass
            except Exception as e:
                logger.error(f"Gemini Stream Error: {str(e)}")
                yield f"Error: {str(e)}"
