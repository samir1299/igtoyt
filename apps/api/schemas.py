from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VideoBase(BaseModel):
    instagram_url: str

class VideoResponse(BaseModel):
    id: str
    instagram_video_id: str
    instagram_url: str
    status: str
    ai_score: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ScrapeRequest(BaseModel):
    instagram_username: str
    min_ai_score: int = 70
