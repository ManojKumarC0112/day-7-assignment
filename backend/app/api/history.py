from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Conversation
from app.schemas.schemas import ConversationResponse

router = APIRouter(prefix="/history", tags=["History"])

from app.models.models import Message

@router.get("", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(Conversation.created_at.desc()).all()
    return conversations

@router.get("/search", response_model=List[ConversationResponse])
def search_history(q: str, db: Session = Depends(get_db)):
    if not q.strip():
        return []
    # Search messages
    matching_messages = db.query(Message).filter(Message.content.like(f"%{q}%")).all()
    conv_ids = {msg.conversation_id for msg in matching_messages}
    
    # Search conversation titles
    matching_convs = db.query(Conversation).filter(Conversation.title.like(f"%{q}%")).all()
    conv_ids.update({c.id for c in matching_convs})
    
    if not conv_ids:
        return []
        
    return db.query(Conversation).filter(Conversation.id.in_(conv_ids)).order_by(Conversation.created_at.desc()).all()

@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation.messages

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return {"status": "deleted"}
