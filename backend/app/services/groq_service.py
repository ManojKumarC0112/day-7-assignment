import asyncio
from groq import AsyncGroq
from app.services.ai_service import AIService
from app.core.config import settings
import logging

logger = logging.getLogger("NOVA_AI")

class GroqService(AIService):
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.default_model = "llama-3.1-8b-instant"

    async def generate_chat_response(self, messages: list[dict], model: str = None) -> str:
        try:
            target_model = model or self.default_model
            response = await self.client.chat.completions.create(
                messages=messages,
                model=target_model,
                temperature=0.7,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API Error: {str(e)}")
            raise e

    async def stream_chat_response(self, messages: list[dict], model: str = None):
        try:
            target_model = model or self.default_model
            stream = await self.client.chat.completions.create(
                messages=messages,
                model=target_model,
                temperature=0.7,
                max_tokens=2048,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Groq Streaming Error: {str(e)}")
            yield f"Error: {str(e)}"

    async def generate_title(self, prompt: str) -> str:
        messages = [
            {"role": "system", "content": "You are a title generator. Generate a concise, 3-5 word title for the following prompt. Do not use quotes or punctuation in the response."},
            {"role": "user", "content": prompt}
        ]
        try:
            title = await self.generate_chat_response(messages, model="llama-3.1-8b-instant")
            return title.strip()
        except Exception:
            return "New Chat"

    async def transcribe_audio(self, file_bytes: bytes, file_name: str) -> str:
        try:
            transcription = await self.client.audio.transcriptions.create(
                file=(file_name, file_bytes),
                model="whisper-large-v3-turbo",
                response_format="json"
            )
            return transcription.text
        except Exception as e:
            logger.error(f"Groq Audio Transcription Error: {str(e)}")
            raise e

groq_service = GroqService()
