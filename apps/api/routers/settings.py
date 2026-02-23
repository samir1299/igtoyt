import json
import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/settings", tags=["settings"])

DATA_FILE = os.path.join(os.path.dirname(__file__), "../../data/user_settings.json")

class UserSettings(BaseModel):
    hook_mode: str  # 'single_video', 'random_video'
    selected_hook_url: str = ""
    publish_time_start: str = "09:00" # HH:MM format
    publish_time_end: str = "21:00"   # HH:MM format

def load_settings():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            return data
    return {
        "hook_mode": "single_video", 
        "selected_hook_url": "",
        "publish_time_start": "09:00",
        "publish_time_end": "21:00"
    }

def save_settings(settings: dict):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(settings, f)

@router.get("/")
def get_user_settings():
    return load_settings()

@router.post("/")
def update_user_settings(settings: UserSettings):
    save_settings(settings.model_dump())
    return {"status": "success", "settings": settings.model_dump()}

from fastapi import UploadFile, File
from supabase_client import supabase

@router.post("/upload-hook")
async def upload_hook_video(file: UploadFile = File(...)):
    if not file.filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 files are supported")
    
    file_bytes = await file.read()
    file_path = f"{file.filename.replace(' ', '_')}"
    
    # Upload to Supabase 'hooks' bucket
    try:
        supabase.storage.from_("hooks").upload(
            path=file_path, 
            file=file_bytes, 
            file_options={"content-type": "video/mp4", "upsert": "true"}
        )
    except Exception as e:
        if "Duplicate" in str(e):
            # Attempt to overwrite by removing first if upsert fails on some sdk versions
            supabase.storage.from_("hooks").remove([file_path])
            supabase.storage.from_("hooks").upload(
                path=file_path, 
                file=file_bytes, 
                file_options={"content-type": "video/mp4"}
            )
        else:
            raise HTTPException(status_code=500, detail=str(e))
            
    # Get public URL
    public_url = supabase.storage.from_("hooks").get_public_url(file_path)
    
    # Also return the list of all files in the bucket
    filesRes = supabase.storage.from_("hooks").list()
    files = [{"name": f["name"], "url": supabase.storage.from_("hooks").get_public_url(f["name"])} for f in filesRes if f["name"].endswith(".mp4")]
    
    return {"status": "success", "url": public_url, "files": files}

@router.get("/hooks")
def list_hooks():
    try:
        filesRes = supabase.storage.from_("hooks").list()
        files = [{"name": f["name"], "url": supabase.storage.from_("hooks").get_public_url(f["name"])} for f in filesRes if f["name"].endswith(".mp4")]
        return {"hooks": files}
    except Exception as e:
        return {"hooks": [], "error": str(e)}

# --- Multi-Account Endpoints ---

class IGAccount(BaseModel):
    username: str

@router.get("/instagram")
def list_ig_accounts():
    res = supabase.table("instagram_accounts").select("*").execute()
    return res.data

@router.post("/instagram")
def add_ig_account(account: IGAccount):
    # Check limit of 5
    count_res = supabase.table("instagram_accounts").select("id", count="exact").execute()
    if count_res.count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 Instagram accounts allowed")
    
    res = supabase.table("instagram_accounts").upsert({"username": account.username}, on_conflict="username").execute()
    return res.data[0]

@router.delete("/instagram/{username}")
def delete_ig_account(username: str):
    supabase.table("instagram_accounts").delete().eq("username", username).execute()
    return {"status": "success"}

@router.get("/youtube/channels")
def list_yt_channels():
    res = supabase.table("youtube_channels").select("id", "channel_name", "youtube_channel_id", "updated_at").execute()
    return res.data

@router.delete("/youtube/channels/{id}")
def delete_yt_channel(id: str):
    supabase.table("youtube_channels").delete().eq("id", id).execute()
    return {"status": "success"}
