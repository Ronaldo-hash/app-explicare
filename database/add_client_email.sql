-- Add client_email column to videos_pecas if it doesn't exist
ALTER TABLE public.videos_pecas ADD COLUMN IF NOT EXISTS client_email TEXT;
