import logging
import os
import json
import random
import urllib.request
import uuid
import shutil
from celery_app import celery_app
from supabase_client import supabase
from services.scraper import InstagramScraper
from services.ai import AIService
from services.video import VideoProcessor

logger = logging.getLogger(__name__)

scraper = InstagramScraper()
ai = AIService()
video_processor = VideoProcessor()

@celery_app.task(bind=True, max_retries=3)
def run_scrape_job(self, job_id: str, username: str, min_score: int):
    logger.info(f"Starting scrape job {job_id} for {username}")
    try:
        supabase.table("scrape_jobs").update({"status": "running"}).eq("id", job_id).execute()
        
        reels = scraper.get_recent_reels(username, limit=10)
        
        best_reel = None
        highest_score = -1
        
        for reel in reels:
            # Check if video already exists
            existing = supabase.table("videos").select("id").eq("instagram_video_id", reel["id"]).execute()
            if existing.data:
                continue
                
            score = ai.score_video(reel["caption"])
            logger.info(f"Reel {reel['id']} score: {score} (min: {min_score})")
            
            if score >= min_score and score > highest_score:
                logger.info(f"New best reel found: {reel['id']} with score {score}")
                highest_score = score
                best_reel = reel
        
        videos_found = 0
        if best_reel:
            videos_found = 1
            # Insert the single best video
            video_res = supabase.table("videos").insert({
                "instagram_video_id": best_reel["id"],
                "instagram_url": best_reel["url"],
                "instagram_caption": best_reel["caption"],
                "instagram_views": best_reel["views"],
                "ai_score": highest_score,
                "status": "discovered"
            }).execute()
            
            vid_id = video_res.data[0]["id"]
            
            # Create pipeline job
            supabase.table("pipeline_jobs").insert({
                "video_id": vid_id,
                "status": "pending",
                "current_step": "download"
            }).execute()
            
            # Trigger process task
            process_video.delay(vid_id)
            
        supabase.table("scrape_jobs").update({
            "status": "completed", 
            "videos_found": videos_found
        }).eq("id", job_id).execute()
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        supabase.table("scrape_jobs").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", job_id).execute()
        self.retry(exc=e)

@celery_app.task(bind=True, max_retries=3)
def process_video(self, video_id: str):
    logger.info(f"Starting process for video {video_id}")
    try:
        video_record = supabase.table("videos").select("*").eq("id", video_id).execute().data[0]
        
        jobs = supabase.table("pipeline_jobs").select("*").eq("video_id", video_id).order("created_at", desc=True).limit(1).execute()
        if not jobs.data:
            return
        pipeline_job_id = jobs.data[0]["id"]
        
        supabase.table("pipeline_jobs").update({"status": "running", "current_step": "download & hook"}).eq("id", pipeline_job_id).execute()
        supabase.table("videos").update({"status": "processing"}).eq("id", video_id).execute()
        
        # Determine paths
        # NOTE: Using apps/api/temp to ensure write permissions in local dev if /tmp is restricted
        # but the previous code used /tmp, let's stick to a robust path
        temp_dir = os.path.join(os.getcwd(), "temp")
        os.makedirs(os.path.join(temp_dir, "raw"), exist_ok=True)
        os.makedirs(os.path.join(temp_dir, "processed"), exist_ok=True)
        
        raw_path = video_processor.download_reel(video_record["instagram_url"], output_dir=os.path.join(temp_dir, "raw"))
        processed_path = os.path.join(temp_dir, "processed", f"{video_id}.mp4")
        
        from routers.settings import load_settings
        
        user_config = load_settings()
        hook_mode = user_config.get("hook_mode", "ai_text")
        
        intro_to_use = None
        hook_text = ""
        
        if hook_mode == "single_video":
            target_url = user_config.get("selected_hook_url")
        elif hook_mode == "random_video":
            filesRes = supabase.storage.from_("hooks").list()
            valid_files = [f for f in filesRes if f["name"].endswith(".mp4")]
            if valid_files:
                random_file = random.choice(valid_files)
                target_url = supabase.storage.from_("hooks").get_public_url(random_file["name"])
        
        if target_url:
            intro_tmp_path = os.path.join(temp_dir, "raw", f"intro_{uuid.uuid4().hex[:8]}.mp4")
            urllib.request.urlretrieve(target_url, intro_tmp_path)
            intro_to_use = intro_tmp_path
        
        video_processor.inject_hook(raw_path, processed_path, hook_text, intro_mp4_path=intro_to_use)
        
        if intro_to_use and os.path.exists(intro_to_use):
            os.remove(intro_to_use)
        
        # 3. Metadata
        metadata = ai.generate_youtube_metadata(video_record["instagram_caption"])
        
        # Update video record
        supabase.table("videos").update({
            "status": "ready",
            "original_file_path": raw_path,
            "processed_file_path": processed_path,
            "hook_text": hook_text,
            "yt_title": metadata.get("title", ""),
            "yt_description": metadata.get("description", "")
        }).eq("id", video_id).execute()
        
        supabase.table("pipeline_jobs").update({"status": "completed", "current_step": "ready"}).eq("id", pipeline_job_id).execute()
        
        # --- AUTO PUBLISH ---
        from tasks.youtube import publish_video
        publish_video.delay(video_id)
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        if 'pipeline_job_id' in locals():
            supabase.table("pipeline_jobs").update({"status": "failed", "error_message": str(e)}).eq("id", pipeline_job_id).execute()
        supabase.table("videos").update({"status": "error", "error_message": str(e)}).eq("id", video_id).execute()
        raise self.retry(exc=e)

@celery_app.task(bind=True)
def daily_smart_scraper(self):
    """
    Runs daily via Celery Beat.
    1. Looks at active Instagram accounts.
    2. Scrapes the text metadata of recent reels.
    3. Finds the single video with the highest views across all monitored accounts that hasn't been posted yet.
    4. Downloads only that video and queues it for variable-time AI publishing.
    """
    logger.info("Executing Daily Smart Scraper...")
    try:
        accounts = supabase.table("instagram_accounts").select("*").execute()
        if not accounts.data:
            logger.info("No active Instagram accounts to scrape.")
            return
            
        best_reel = None
        highest_views = -1
        source_account = ""
        
        for account in accounts.data:
            username = account["username"]
            try:
                # Scrape minimal text-only metadata (fast and low-bandwidth)
                reels = scraper.get_recent_reels(username, limit=10)
                for reel in reels:
                    # Check if already processed
                    existing = supabase.table("videos").select("id").eq("instagram_video_id", reel["id"]).execute()
                    if existing.data:
                        continue
                        
                    if reel["views"] > highest_views:
                        highest_views = reel["views"]
                        best_reel = reel
                        source_account = username
            except Exception as e:
                logger.error(f"Error scraping {username} during daily run: {e}")
                
        if best_reel:
            logger.info(f"Daily Winner selected: {best_reel['id']} from {source_account} with {highest_views} views.")
            
            # Record Job
            job_res = supabase.table("scrape_jobs").insert({
                "instagram_username": source_account,
                "status": "completed",
                "videos_found": 1
            }).execute()
            
            # Insert Video
            video_res = supabase.table("videos").insert({
                "instagram_video_id": best_reel["id"],
                "instagram_url": best_reel["url"],
                "instagram_caption": best_reel["caption"],
                "instagram_views": best_reel["views"],
                "ai_score": 10,  # Max score by definition since we selected by views
                "status": "discovered"
            }).execute()
            
            vid_id = video_res.data[0]["id"]
            
            # We delay the process task by a random amount calculated by the AI schedule strategy
            # For robustness, we will create a helper in youtube.py to determine upload times
            # Alternatively, we just queue it now and the publisher itself will wait.
            
            supabase.table("pipeline_jobs").insert({
                "video_id": vid_id,
                "status": "pending",
                "current_step": "download"
            }).execute()
            
            # Trigger heavy processing
            process_video.delay(vid_id)
        else:
            logger.info("No new viral videos found across any monitored accounts today.")
            
    except Exception as e:
        logger.error(f"Daily Scrape failed: {e}")

