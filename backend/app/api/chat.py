import base64
from fastapi import APIRouter, Depends, Form, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.models.models import Conversation, Message
from app.services.groq_service import groq_service
from app.services.file_service import file_service
from app.prompts.loader import load_prompt
import json
import time
import logging

import asyncio
from app.services.ai.factory import AIServiceFactory

logger = logging.getLogger("NOVA_AI")

router = APIRouter(prefix="/chat", tags=["Chat"])

async def run_provider_model(provider_name: str, model_name: str, messages: list, context_text: str):
    provider_inst = AIServiceFactory.get_provider(provider_name)
    start_time = time.perf_counter()
    try:
        res = await provider_inst.chat(messages, model=model_name, context=context_text)
        return {
            "provider": provider_name,
            "model": model_name,
            "text": res["text"],
            "latency": res["latency"],
            "tokens": res["tokens"],
            "error": None
        }
    except Exception as e:
        import traceback
        logger.error(f"Error in running parallel provider {provider_name}: {str(e)}\n{traceback.format_exc()}")
        elapsed = time.perf_counter() - start_time
        return {
            "provider": provider_name,
            "model": model_name,
            "text": f"Error running model: {str(e)}",
            "latency": round(elapsed, 2),
            "tokens": 0,
            "error": str(e)
        }

@router.post("")
async def unified_chatEndpoint(
    message: str = Form(...),
    conversation_id: Optional[int] = Form(None),
    provider: Optional[str] = Form("groq"),
    model: Optional[str] = Form(None),
    compare_mode: Optional[str] = Form("false"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    import time
    # 1. Handle Conversation linking/creation
    if not conversation_id:
        title = await groq_service.generate_title(message)
        conv = Conversation(title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conversation_id = conv.id
    else:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            conv = Conversation(title="New Chat")
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = conv.id

    # 2. Process uploaded file (Image vs Document)
    is_image = False
    image_payload = None
    context_text = ""
    PROVIDER_MODEL_MAP = {
        "gemini": "gemini-2.5-flash",
        "groq": "llama-3.3-70b-versatile",
        "nvidia": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
    }
    
    selected_prov = provider or "groq"
    if not model or model == "undefined" or model == "null" or model == "":
        target_model = PROVIDER_MODEL_MAP.get(selected_prov, "llama-3.3-70b-versatile")
    else:
        target_model = model

    if file:
        mime_type = file.content_type or ""
        if mime_type.startswith("image/"):
            is_image = True
            target_model = "meta-llama/llama-4-scout-17b-16e-instruct"
            # Read image and convert to base64
            file_bytes = await file.read()
            base64_image = base64.b64encode(file_bytes).decode("utf-8")
            image_payload = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            }
        else:
            # Standard document parsing
            file_path = await file_service.save_temp_file(file)
            context_text = file_service.extract_text(file_path)

    # 3. Build System Prompt & History
    if context_text:
        system_prompt = load_prompt("document").replace("{context}", context_text[:10000]) # Cap to avoid token limit overflow easily
    else:
        system_prompt = load_prompt("chat")
        
    system_prompt = system_prompt.replace("the Groq API", f"the {selected_prov.upper() if selected_prov in ('groq', 'nvidia') else selected_prov.title()} API")

    # Fetch previous messages
    past_messages_db = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.id.asc()).all()
    
    groq_messages = []
    # If standard chat context payload is requested, we can use the formatted system context setup
    for msg in past_messages_db[-10:]:  # Keep last 10 messages for context
        groq_messages.append({"role": msg.role, "content": msg.content})
        
    # Add Current message
    if is_image and image_payload:
        groq_messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": message},
                image_payload
            ]
        })
    else:
        groq_messages.append({"role": "user", "content": message})

    # 4. Save User Message in DB (We save the text prompt)
    user_msg_db = Message(
        conversation_id=conversation_id, 
        role="user", 
        content=message,
        provider=provider,
        model=model
    )
    db.add(user_msg_db)
    db.commit()

    # 5. Generator for Streaming
    async def generate():
        full_response = ""
        # Yield metadata first (so frontend has the assigned conversation_id instantly)
        yield json.dumps({"type": "metadata", "conversation_id": conversation_id}) + "\n"
        
        if compare_mode == "true":
            # Run comparison in parallel for all three providers
            tasks = [
                run_provider_model("gemini", "gemini-2.5-flash", groq_messages, system_prompt if not context_text else system_prompt),
                run_provider_model("groq", "llama-3.3-70b-versatile", groq_messages, system_prompt if not context_text else system_prompt),
                run_provider_model("nvidia", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", groq_messages, system_prompt if not context_text else system_prompt)
            ]
            results = await asyncio.gather(*tasks)
            yield json.dumps({"type": "compare", "results": results}) + "\n"
            
            combined_summary = json.dumps(results)
            # Save Assistant Comparison Message
            assistant_msg_db = Message(
                conversation_id=conversation_id, 
                role="assistant", 
                content=combined_summary,
                provider="comparison",
                model="parallel-trio"
            )
            db.add(assistant_msg_db)
            db.commit()
        else:
            # Single model chat
            provider_service = AIServiceFactory.get_provider(provider or "groq")
            async for chunk in provider_service.stream(groq_messages, model=target_model, context=system_prompt):
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"
                full_response += chunk
                
            # Save Assistant Message
            assistant_msg_db = Message(
                conversation_id=conversation_id, 
                role="assistant", 
                content=full_response,
                provider=provider,
                model=model
            )
            db.add(assistant_msg_db)
            db.commit()

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        text = await groq_service.transcribe_audio(file_bytes, file.filename)
        return {"text": text}
    except Exception as e:
        return {"error": str(e)}
