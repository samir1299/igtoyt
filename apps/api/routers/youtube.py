from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.youtube import YouTubeService
from supabase_client import supabase
from config import settings

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])
yt_service = YouTubeService()

class AuthCallback(BaseModel):
    code: str
    redirect_uri: str = "http://localhost:3000/api/auth/youtube/callback"

@router.get("/auth-url")
async def get_auth_url(redirect_uri: str = "http://localhost:3000/api/auth/youtube/callback"):
    url = yt_service.get_auth_url(redirect_uri)
    return {"url": url}

@router.post("/callback")
async def handle_callback(data: AuthCallback):
    print(f"DEBUG: YouTube callback received with code: {data.code[:10]}... for URI: {data.redirect_uri}")
    try:
        # Check limit of 5
        count_res = supabase.table("youtube_channels").select("id", count="exact").execute()
        if count_res.count >= 5:
            raise HTTPException(status_code=400, detail="Maximum of 5 YouTube channels allowed")

        creds = yt_service.exchange_code(data.code, data.redirect_uri)
        
        # Fetch channel metadata
        from googleapiclient.discovery import build
        import google.oauth2.credentials
        
        creds_obj = google.oauth2.credentials.Credentials(creds["token"], refresh_token=creds["refresh_token"])
        yt = build('youtube', 'v3', credentials=creds_obj)
        ch_res = yt.channels().list(part="snippet", mine=True).execute()
        
        if not ch_res.get("items"):
            raise Exception("Could not find YouTube channel")
            
        channel = ch_res["items"][0]
        channel_id = channel["id"]
        channel_name = channel["snippet"]["title"]
        
        supabase.table("youtube_channels").upsert({
            "youtube_channel_id": channel_id,
            "channel_name": channel_name,
            "access_token": creds["token"],
            "refresh_token": creds["refresh_token"],
        }, on_conflict="youtube_channel_id").execute()
        
        return {"status": "success", "channel_name": channel_name}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status")
async def get_status():
    res = supabase.table("youtube_channels").select("channel_name", "updated_at").execute()
    if res.data:
        return {"connected": True, "channel": res.data[0]}
    return {"connected": False}

@router.get("/analytics")
async def get_analytics():
    try:
        res = supabase.table("youtube_channels").select("*").execute()
        if not res.data:
            return {"channels": []}
            
        all_analytics = []
        for channel in res.data:
            creds = {
                "token": channel["access_token"],
                "refresh_token": channel["refresh_token"],
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET
            }
            stats = yt_service.get_channel_stats(creds)
            if stats:
                stats["id"] = channel["id"]
                recent_vids = yt_service.get_recent_videos_stats(creds, limit=5)
                stats["recent_videos"] = recent_vids
                all_analytics.append(stats)
                
        return {"channels": all_analytics}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
