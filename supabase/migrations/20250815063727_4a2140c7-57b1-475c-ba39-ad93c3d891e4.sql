-- Drop the problematic policy and create a completely permissive one for INSERT
DROP POLICY IF EXISTS "Allow all submissions with optional user_id" ON public.submissions;

-- Create a very permissive policy that allows all insertions
CREATE POLICY "Allow all submissions" 
ON public.submissions 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Ensure storage buckets have proper policies for file uploads
CREATE POLICY "Allow authenticated users to upload proof files" 
ON storage.objects 
FOR INSERT 
TO authenticated, anon
WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "Allow authenticated users to upload video files" 
ON storage.objects 
FOR INSERT 
TO authenticated, anon
WITH CHECK (bucket_id = 'video-proofs');

CREATE POLICY "Allow public access to proof files" 
ON storage.objects 
FOR SELECT 
TO authenticated, anon
USING (bucket_id = 'proofs');

CREATE POLICY "Allow public access to video files" 
ON storage.objects 
FOR SELECT 
TO authenticated, anon
USING (bucket_id = 'video-proofs');