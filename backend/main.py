from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, history
from app.core.config import settings

from app.database.database import engine, Base
import app.models.models as models

# Ensure all SQLite tables are automatically created on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(history.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/version")
def version():
    return {"version": settings.VERSION}
