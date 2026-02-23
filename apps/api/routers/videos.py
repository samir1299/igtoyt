from fastapi import APIRouter
from supabase_client import supabase

router = APIRouter(prefix="/api/videos", tags=["Videos"])

@router.get("/stats")
async def get_stats():
    # A single user internal tool so we can just grab overall counts
    # using simple queries
    
    # In python supabase we can just fetch all or construct count queries
    # To keep it simple we query the counts using exact=True
    res_total = supabase.table("videos").select("id", count="exact").execute()
    total = res_total.count if res_total.count is not None else 0
    
    res_pipeline = supabase.table("videos").select("id", count="exact").in_("status", ["processing", "ready", "retrying"]).execute()
    pipeline = res_pipeline.count if res_pipeline.count is not None else 0
    
    res_published = supabase.table("videos").select("id", count="exact").eq("status", "published").execute()
    published = res_published.count if res_published.count is not None else 0
    
    res_yt = supabase.table("youtube_channels").select("id", count="exact").execute()
    yt_count = res_yt.count if res_yt.count is not None else 0
    
    res_ig = supabase.table("instagram_accounts").select("id", count="exact").execute()
    ig_count = res_ig.count if res_ig.count is not None else 0
    
    return {
        "total": total,
        "pipeline": pipeline,
        "published": published,
        "youtube_channels": yt_count,
        "instagram_accounts": ig_count
    }

@router.get("/")
async def list_videos():
    res = supabase.table("videos").select("*").order("created_at", desc=True).limit(20).execute()
    return {"videos": res.data}
