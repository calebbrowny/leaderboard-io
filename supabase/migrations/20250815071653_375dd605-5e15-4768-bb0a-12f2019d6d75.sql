-- Fix RLS policies to allow anonymous submissions
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create submissions for leaderboards" ON public.submissions;

-- Create new policy that allows both authenticated and anonymous submissions
CREATE POLICY "allow_all_submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Update storage policies for the proofs bucket to allow anonymous uploads with better organization
CREATE POLICY "anonymous_can_upload_to_proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'proofs' AND 
  (storage.foldername(name))[1] = 'anonymous'
);