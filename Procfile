web: cd apps/api && uvicorn main:app --host 0.0.0.0 --port $PORT
worker: cd apps/api && celery -A celery_app worker --concurrency=1 --loglevel=info
