-- Remove the restrictive policy that blocks all access to submissions
DROP POLICY IF EXISTS "Block anonymous access to submissions" ON public.submissions;

-- Make sure the video-proofs bucket allows public access for viewing (needed for leaderboard display)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'video-proofs';