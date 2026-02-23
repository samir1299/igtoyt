#!/bin/bash
echo "Starting Celery Worker and FastAPI Server..."

cd apps/api

# Start Celery in the background
celery -A celery_app worker --concurrency=1 --loglevel=info &

# Start Uvicorn in the foreground
uvicorn main:app --host 0.0.0.0 --port $PORT
