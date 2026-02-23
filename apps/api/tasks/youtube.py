import logging
from celery_app import celery_app
from supabase_client import supabase
from services.youtube import YouTubeService

logger = logging.getLogger(__name__)
yt_service = YouTubeService()

@celery_app.task(bind=True, max_retries=3)
def publish_video(self, video_id: str):
    logger.info(f"Publishing video {video_id} to YouTube")
    try:
        video_record = supabase.table("videos").select("*").eq("id", video_id).execute().data[0]
        
        channels = supabase.table("youtube_channels").select("*").execute()
        if not channels.data:
            logger.error("No YouTube channel connected.")
            supabase.table("videos").update({"status": "failed", "error_message": "No YouTube channel"}).eq("id", video_id).execute()
            return
            
        channel = channels.data[0]
        
        # In a real app the client ID and secret are passed to the Credential object, but the google auth lib handles
        # it mostly through the from_client_config unless manually instantiated.
        # So we supply it here from config.
        from config import settings
        creds = {
            "token": channel["access_token"],
            "refresh_token": channel["refresh_token"],
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": settings.YOUTUBE_CLIENT_ID,
            "client_secret": settings.YOUTUBE_CLIENT_SECRET,
            "scopes": ["https://www.googleapis.com/auth/youtube.upload"]
        }
        
        try:
            response = yt_service.upload_video(
                credentials_dict=creds,
                file_path=video_record["processed_file_path"],
                title=video_record["yt_title"],
                description=video_record["yt_description"],
                tags=video_record["yt_hashtags"] or []
            )
            
            vid_url = f"https://youtube.com/shorts/{response['id']}" if response else ""
            
            supabase.table("videos").update({
                "status": "published",
                "youtube_video_url": vid_url
            }).eq("id", video_id).execute()
            
            supabase.table("pipeline_jobs").update({"status": "completed", "current_step": "published"}).eq("video_id", video_id).execute()
            
        except Exception as e:
            if str(e) == "quotaExceeded":
                logger.warning(f"YouTube Quota Exceeded for {video_id}, pausing video.")
                supabase.table("videos").update({"status": "paused_quota"}).eq("id", video_id).execute()
                return
            raise e
            
    except Exception as e:
        logger.error(f"Failed to publish to YouTube: {e}")
        supabase.table("videos").update({"status": "error", "error_message": str(e)}).eq("id", video_id).execute()
        raise self.retry(exc=e)

@celery_app.task
def retry_paused_videos():
    """Scheduled task for Celery beat to retry quota-paused videos at midnight PST"""
    logger.info("Running scheduled retry for paused videos")
    paused_videos = supabase.table("videos").select("id").eq("status", "paused_quota").execute()
    for vid in paused_videos.data:
        supabase.table("videos").update({"status": "retrying"}).eq("id", vid["id"]).execute()
        publish_video.delay(vid["id"])
