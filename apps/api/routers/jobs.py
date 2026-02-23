from fastapi import APIRouter, HTTPException
from schemas import ScrapeRequest
from supabase_client import supabase
from tasks.pipeline import run_scrape_job
import uuid

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("/scrape")
async def trigger_scrape(request: ScrapeRequest):
    try:
        # 1. Create job record in Supabase
        job_res = supabase.table("scrape_jobs").insert({
            "instagram_username": request.instagram_username,
            "status": "pending"
        }).execute()
        
        if not job_res.data:
            raise HTTPException(status_code=500, detail="Failed to create job record")
            
        job_id = job_res.data[0]["id"]
        
        # 2. Enqueue Celery task
        run_scrape_job.delay(job_id, request.instagram_username, request.min_ai_score)
        
        return {"status": "success", "job_id": job_id, "username": request.instagram_username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_jobs():
    res = supabase.table("scrape_jobs").select("*").order("created_at", desc=True).limit(10).execute()
    return res.data
