-- Fix security vulnerability: Remove public access to sensitive submission data
-- Drop the overly permissive policy that exposes all submission data
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.submissions;

-- Create a secure view for public leaderboard display that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_submissions AS
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
  -- Only show proof URLs, not sensitive metadata
  proof_url,
  video_url
FROM public.submissions 
WHERE status = 'APPROVED';

-- Enable RLS on the view
ALTER VIEW public.public_submissions SET (security_barrier = true);

-- Create new granular RLS policies for the submissions table

-- 1. Users can view their own complete submission data
CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Leaderboard owners can view all submission data for their leaderboards
CREATE POLICY "Leaderboard owners can view submissions for their leaderboards" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l 
    WHERE l.id = leaderboard_id AND l.owner_user_id = auth.uid()
  )
);

-- 3. Admins can view all submissions
CREATE POLICY "Admins can manage all submissions" 
ON public.submissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Users can still create submissions
CREATE POLICY "Users can create submissions for leaderboards" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Leaderboard owners can update submission status for their leaderboards
CREATE POLICY "Leaderboard owners can update submissions for their leaderboards" 
ON public.submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l 
    WHERE l.id = leaderboard_id AND l.owner_user_id = auth.uid()
  )
);

-- Grant access to the public view for anonymous users (for public leaderboards)
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;