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

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("")
async def unified_chatEndpoint(
    message: str = Form(...),
    conversation_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
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
    target_model = None

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

    # Fetch previous messages
    past_messages_db = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.id.asc()).all()
    
    groq_messages = [{"role": "system", "content": system_prompt}]
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
    user_msg_db = Message(conversation_id=conversation_id, role="user", content=message)
    db.add(user_msg_db)
    db.commit()

    # 5. Generator for Streaming
    async def generate():
        full_response = ""
        # Yield metadata first (so frontend has the assigned conversation_id instantly)
        yield json.dumps({"type": "metadata", "conversation_id": conversation_id}) + "\n"
        
        async for chunk in groq_service.stream_chat_response(groq_messages, model=target_model):
            yield json.dumps({"type": "chunk", "content": chunk}) + "\n"
            full_response += chunk
            
        # Save Assistant Message
        assistant_msg_db = Message(conversation_id=conversation_id, role="assistant", content=full_response)
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
