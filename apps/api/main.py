from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import videos, jobs, youtube, settings as settings_router

app = FastAPI(
    title="ReelFlow API",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router)
app.include_router(jobs.router)
app.include_router(youtube.router)
app.include_router(settings_router.router)

@app.get("/")
async def root():
    return {"message": "ReelFlow API is running"}

@app.get("/api")
async def api_root():
    return {"message": "ReelFlow API v1", "docs": "/docs"}

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.1.0"}
