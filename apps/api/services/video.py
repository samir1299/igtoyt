import yt_dlp
import ffmpeg
import os
import uuid
from typing import Optional

class VideoProcessor:
    def download_reel(self, url: str, output_dir: str = "/tmp") -> Optional[str]:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        vid_id = str(uuid.uuid4())
        out_tmpl = os.path.join(output_dir, f"{vid_id}.%(ext)s")
        
        ydl_opts = {
            'outtmpl': out_tmpl,
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'quiet': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                ext = info.get('ext', 'mp4')
                return os.path.join(output_dir, f"{vid_id}.{ext}")
        except Exception as e:
            raise Exception(f"Failed to download video: {e}")

    def inject_hook(self, input_path: str, output_path: str, hook_text: str, intro_mp4_path: Optional[str] = None):
        try:
            main_stream = ffmpeg.input(input_path)
            
            if intro_mp4_path and os.path.exists(intro_mp4_path):
                # 1. We have a custom 2-second video to prepend.
                intro_stream = ffmpeg.input(intro_mp4_path)
                
                # Fetch original video properties to ensure the custom intro matches exactly (or the concat fails)
                probe = ffmpeg.probe(input_path)
                video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
                width = int(video_info['width'])
                height = int(video_info['height'])
                
                # Force the intro to scale/crop to the exact dimensions of the target video and set SAR/DAR
                intro_vid = intro_stream.video.filter('scale', width, height, force_original_aspect_ratio='increase')\
                                              .filter('crop', width, height)\
                                              .filter('setsar', 1)
                intro_aud = intro_stream.audio
                
                main_vid = main_stream.video.filter('setsar', 1)
                main_aud = main_stream.audio

                # Concat the two clips (video tracking + audio tracking)
                joined = ffmpeg.concat(intro_vid, intro_aud, main_vid, main_aud, v=1, a=1)
                
                out = ffmpeg.output(joined.video, joined.audio, output_path, vcodec='libx264', acodec='aac')
                
            else:
                # 2. No custom video provided, fallback to the standard 2-second text overlay effect
                video = main_stream.video.drawtext(
                    text=hook_text,
                    fontsize=72,
                    fontcolor='white',
                    bordercolor='black',
                    borderw=4,
                    x='(w-text_w)/2',
                    y='(h-text_h)/2 - 150',
                    enable='between(t,0,2)'
                )
                
                audio = main_stream.audio
                out = ffmpeg.output(video, audio, output_path, vcodec='libx264', acodec='aac')
                
            out.run(overwrite_output=True, quiet=True)
            return output_path
        except ffmpeg.Error as e:
            err = e.stderr.decode('utf8') if e.stderr else str(e)
            raise Exception(f"FFmpeg process failed: {err}")
