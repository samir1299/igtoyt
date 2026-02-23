from celery import Celery
from config import settings

# Determine Broker conditionally (fallback to SQLite for Windows Local Dev if Redis isn't running)
broker_url = settings.REDIS_URL
if "localhost" in broker_url or "127.0.0.1" in broker_url:
    broker_url = "sqla+sqlite:///celery_broker.sqlite"

celery_app = Celery(
    "reelflow",
    broker=broker_url,
    backend="db+sqlite:///celery_backend.sqlite"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Los_Angeles",
    enable_utc=False,
    worker_prefetch_multiplier=1,
    include=["tasks.pipeline", "tasks.youtube"]
)

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "retry-paused-videos-at-midnight": {
        "task": "tasks.youtube.retry_paused_videos",
        "schedule": crontab(hour=0, minute=5), # 00:05 PST
    },
    "daily-smart-scraper": {
        "task": "tasks.pipeline.daily_smart_scraper",
        "schedule": crontab(hour=6, minute=0), # Run daily at 6:00 AM PST 
    }
}
