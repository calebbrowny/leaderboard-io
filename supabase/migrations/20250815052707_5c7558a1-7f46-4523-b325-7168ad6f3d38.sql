-- Add logo_url field to leaderboards table
ALTER TABLE public.leaderboards 
ADD COLUMN logo_url TEXT;