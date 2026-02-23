import os
import google.oauth2.credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from config import settings
import logging

logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = {
    "web": {
        "client_id": settings.YOUTUBE_CLIENT_ID, 
        "client_secret": settings.YOUTUBE_CLIENT_SECRET, 
        "auth_uri": "https://accounts.google.com/o/oauth2/auth", 
        "token_uri": "https://oauth2.googleapis.com/token"
    }
}
SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
]

class YouTubeService:
    def get_auth_url(self, redirect_uri: str) -> str:
        flow = Flow.from_client_config(CLIENT_SECRETS_FILE, scopes=SCOPES)
        flow.redirect_uri = redirect_uri
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url
        
    def exchange_code(self, code: str, redirect_uri: str) -> dict:
        flow = Flow.from_client_config(CLIENT_SECRETS_FILE, scopes=SCOPES)
        flow.redirect_uri = redirect_uri
        flow.fetch_token(code=code)
        creds = flow.credentials
        return {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": creds.scopes
        }



    def upload_video(self, credentials_dict: dict, file_path: str, title: str, description: str, tags: list):
        creds = google.oauth2.credentials.Credentials(**credentials_dict)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
        youtube = build('youtube', 'v3', credentials=creds)
        
        logger.info(f"Publishing video '{title}' immediately as public.")
        
        body = {
            'snippet': {
                'title': title,
                'description': description,
                'tags': tags,
                'categoryId': '24' # Entertainment
            },
            'status': {
                'privacyStatus': 'public', # Instant publish
                'selfDeclaredMadeForKids': False
            }
        }
        
        media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
        request = youtube.videos().insert(
            part=",".join(body.keys()),
            body=body,
            media_body=media
        )
        
        try:
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    logger.info(f"Uploaded {int(status.progress() * 100)}%")
            return response
        except Exception as e:
            if "quota" in str(e).lower():
                raise Exception("quotaExceeded")
            raise e

    def get_channel_stats(self, credentials_dict: dict):
        creds = google.oauth2.credentials.Credentials(**credentials_dict)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
        youtube = build('youtube', 'v3', credentials=creds)
        
        ch_res = youtube.channels().list(
            part="snippet,statistics",
            mine=True
        ).execute()
        
        if not ch_res.get("items"):
            return None
            
        channel = ch_res["items"][0]
        stats = channel["statistics"]
        snippet = channel["snippet"]
        
        return {
            "channel_name": snippet["title"],
            "subscriber_count": stats.get("subscriberCount", "0"),
            "view_count": stats.get("viewCount", "0"),
            "video_count": stats.get("videoCount", "0"),
            "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url")
        }

    def get_recent_videos_stats(self, credentials_dict: dict, limit: int = 5):
        creds = google.oauth2.credentials.Credentials(**credentials_dict)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
        youtube = build('youtube', 'v3', credentials=creds)
        
        # 1. Get channel's uploads playlist
        ch_res = youtube.channels().list(part="contentDetails", mine=True).execute()
        uploads_id = ch_res['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # 2. Get recent videos in that playlist
        pl_res = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_id,
            maxResults=limit
        ).execute()
        
        if not pl_res.get("items"):
            return []
            
        video_ids = [item['snippet']['resourceId']['videoId'] for item in pl_res['items']]
        
        # 3. Get stats for those videos
        v_res = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        videos_stats = []
        for item in v_res.get("items", []):
            videos_stats.append({
                "id": item["id"],
                "title": item["snippet"]["title"],
                "published_at": item["snippet"]["publishedAt"],
                "view_count": int(item["statistics"].get("viewCount", 0)),
                "like_count": int(item["statistics"].get("likeCount", 0)),
                "comment_count": int(item["statistics"].get("commentCount", 0))
            })
            
        return videos_stats
