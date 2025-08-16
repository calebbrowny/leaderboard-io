-- Remove anonymous insert policies from submissions table to prevent spam/abuse
DROP POLICY IF EXISTS "anon_and_auth_can_insert_submissions" ON public.submissions;
DROP POLICY IF EXISTS "anon_insert_submissions" ON public.submissions;

-- Create a more secure insert policy that requires authentication for video uploads
-- but allows anonymous submissions for basic entries (common for leaderboards)
CREATE POLICY "authenticated_users_can_insert_submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to submit with video
  (auth.uid() IS NOT NULL) OR 
  -- Allow anonymous submissions only without video (basic leaderboard entries)
  (auth.uid() IS NULL AND video_url IS NULL)
);