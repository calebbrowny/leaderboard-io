-- Remove the restrictive policy that blocks all access to submissions
DROP POLICY IF EXISTS "Block anonymous access to submissions" ON public.submissions;

-- Ensure video-proofs bucket allows authenticated users to upload their own videos
CREATE POLICY "Users can upload their own video proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own video proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow leaderboard owners to view video proofs for their leaderboards
CREATE POLICY "Leaderboard owners can view submission videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'video-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.leaderboards l ON s.leaderboard_id = l.id
    WHERE l.owner_user_id = auth.uid()
    AND s.video_url LIKE '%' || name || '%'
  )
);