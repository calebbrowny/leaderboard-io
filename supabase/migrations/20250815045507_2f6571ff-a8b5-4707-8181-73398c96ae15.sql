-- Fix security vulnerability by replacing existing policies with secure ones

-- Drop ALL existing policies on submissions table
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can create submissions for leaderboards" ON public.submissions;
DROP POLICY IF EXISTS "Leaderboard owners can manage submissions" ON public.submissions;
DROP POLICY IF EXISTS "Leaderboard owners can view submissions for their leaderboards" ON public.submissions;
DROP POLICY IF EXISTS "Leaderboard owners can update submissions for their leaderboards" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.submissions;

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
  proof_url,
  video_url
FROM public.submissions 
WHERE status = 'APPROVED';

-- Create new secure RLS policies

-- 1. Users can view their own complete submission data
CREATE POLICY "Users can view own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Leaderboard owners can view all submission data for their leaderboards  
CREATE POLICY "Owners can view leaderboard submissions" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l 
    WHERE l.id = leaderboard_id AND l.owner_user_id = auth.uid()
  )
);

-- 3. Admins can manage all submissions
CREATE POLICY "Admins can manage submissions" 
ON public.submissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Users can create submissions
CREATE POLICY "Users can create submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Leaderboard owners can update submissions for their leaderboards
CREATE POLICY "Owners can update leaderboard submissions" 
ON public.submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l 
    WHERE l.id = leaderboard_id AND l.owner_user_id = auth.uid()
  )
);

-- Grant access to the secure public view
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;