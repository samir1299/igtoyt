from groq import Groq
from config import settings
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

client = Groq(api_key=settings.GROQ_API_KEY)

class AIService:
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def score_video(self, caption: str) -> int:
        try:
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL_SMALL,
                messages=[
                    {"role": "system", "content": "You are a viral video analyzer. Rate the following video caption for viral potential from 0 to 100. Return only the integer score and nothing else."},
                    {"role": "user", "content": caption}
                ],
                temperature=0.1
            )
            score_str = response.choices[0].message.content.strip()
            # Extract just the digits if there is extra text
            score = int(''.join(filter(str.isdigit, score_str)))
            return min(max(score, 0), 100)
        except Exception as e:
            logger.error(f"Failed to score video: {e}")
            raise e

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def generate_hook(self, caption: str) -> str:
        try:
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL_SMALL,
                messages=[
                    {"role": "system", "content": "You are a YouTube Shorts expert. Write a punchy 3-7 word text hook to overlay on the first 2 seconds of this video, based on its caption. Return ONLY the text of the hook, no quotes, no conversational filler."},
                    {"role": "user", "content": caption}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content.strip().replace('"', '')
        except Exception as e:
            logger.error(f"Failed to generate hook: {e}")
            raise e

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def generate_youtube_metadata(self, caption: str, search_context: str = "") -> dict:
        try:
            prompt = f"Original Caption: {caption}\nContext: {search_context}"
            
            system_instruction = (
                "You are an elite YouTube Shorts Growth Hacker running a highly successful faceless channel. "
                "Your sheer focus is maximizing view velocity, algorithmic reach, and audience retention. "
                "Given the original Instagram caption of a video, you must repackage it for YouTube Shorts virality:\n\n"
                "1. TITLE: Write a punchy, curiosity-inducing title under 55 characters. It must create an 'information gap' that forces the viewer to watch. No clickbait, but highly engaging.\n"
                "2. DESCRIPTION: Write a natural, 1-2 sentence compelling description using conversational 'YouTuber' tone. "
                "CRITICAL: You MUST include exactly 5 visible #hashtags at the very bottom of this description text, separated by spaces!\n"
                "3. TAGS: Generate an array of exactly 5 backend keyword tags. The first 2 must be standard viral tags ('shorts', 'viral', 'fyp'). The last 3 must be hyper-specific, high-volume search niche tags targeting the video's core subject.\n\n"
                "You MUST format the response strictly as valid JSON with the exact keys: 'title' (string), 'description' (string) [ensure the 5 #tags are in this string!], and 'tags' (array of strings)."
            )
            
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL_LARGE,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Failed to generate metadata: {e}")
            raise e
