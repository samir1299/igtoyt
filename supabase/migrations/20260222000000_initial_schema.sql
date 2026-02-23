CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.instagram_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.youtube_channels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_channel_id  TEXT NOT NULL UNIQUE,
  channel_name        TEXT NOT NULL,
  access_token        TEXT NOT NULL,
  refresh_token       TEXT NOT NULL,
  token_expires_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scrape_jobs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_username    TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  videos_found          INTEGER DEFAULT 0,
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.videos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_video_id    TEXT NOT NULL UNIQUE,
  instagram_url         TEXT NOT NULL,
  instagram_caption     TEXT,
  instagram_views       BIGINT DEFAULT 0,
  ai_score              INTEGER,
  status                TEXT NOT NULL DEFAULT 'discovered',
  original_file_path    TEXT,
  processed_file_path   TEXT,
  hook_text             TEXT,
  hook_style            TEXT DEFAULT 'bold_text',
  yt_title              TEXT,
  yt_description        TEXT,
  yt_hashtags           TEXT[],
  youtube_video_url     TEXT,
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pipeline_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id        UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',
  current_step    TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Storage for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT DO NOTHING;
