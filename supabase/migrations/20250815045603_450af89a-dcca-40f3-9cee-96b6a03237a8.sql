-- Fix the SECURITY DEFINER view warning by creating a standard view
-- Drop the current view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_submissions;

-- Create a standard view (not SECURITY DEFINER) for public access
CREATE VIEW public.public_submissions AS
SELECT 
  id,
  leaderboard_id,
  -- Only show initials instead of full name for privacy
  CASE 
    WHEN length(full_name) > 0 THEN 
      substring(full_name from 1 for 1) || 
      CASE 
        WHEN position(' ' in full_name) > 0 THEN 
          '. ' || substring(full_name from position(' ' in full_name) + 1 for 1) || '.'
        ELSE '.'
      END
    ELSE 'Anonymous'
  END as display_name,
  gender,
  value_raw,
  value_display,
  status,
  submitted_at,
  approved_at,
  proof_url,
  video_url
FROM public.submissions 
WHERE status = 'APPROVED';

-- Grant access to the secure public view
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;