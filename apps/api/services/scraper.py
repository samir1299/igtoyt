import instaloader
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class InstagramScraper:
    def __init__(self):
        # We explicitly turn off extra downloads to only get the metadata we need quickly
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

    def get_recent_reels(self, username: str, limit: int = 10) -> List[Dict]:
        """
        Scrape a profile for its most recent reels/videos.
        Returns a list of dicts with id, url, views, and caption.
        Throws an Exception if it hits a hard block or rate limit.
        """
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
            reels = []
            count = 0
            
            # get_posts() returns all posts, we filter for videos
            for post in profile.get_posts():
                count += 1
                if count > limit * 3: # prevent unbounded scraping if person has no videos
                    break
                    
                if post.is_video:
                    reels.append({
                        "id": post.shortcode,
                        "url": f"https://www.instagram.com/reel/{post.shortcode}/",
                        "views": post.video_view_count if post.video_view_count else 0,
                        "caption": post.caption or ""
                    })
                    
                if len(reels) >= limit:
                    break
                    
            return reels
        except Exception as e:
            logger.error(f"Failed to scrape {username}: {str(e)}")
            raise e
