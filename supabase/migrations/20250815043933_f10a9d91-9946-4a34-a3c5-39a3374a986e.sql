-- Update leaderboards table to add verification and submission settings
ALTER TABLE public.leaderboards 
ADD COLUMN requires_verification BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN auto_approve BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN submissions_per_user INTEGER DEFAULT NULL,
ADD COLUMN smart_time_parsing BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN end_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN submission_deadline TIMESTAMPTZ DEFAULT NULL;

-- Update submissions table to link to leaderboards instead of challenges
ALTER TABLE public.submissions 
DROP COLUMN challenge_id,
ADD COLUMN leaderboard_id UUID NOT NULL REFERENCES public.leaderboards(id) ON DELETE CASCADE,
ADD COLUMN video_url TEXT,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN rejection_reason TEXT,
ADD COLUMN submission_metadata JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for video proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-proofs', 'video-proofs', false);

-- Create storage policies for video uploads
CREATE POLICY "Users can upload their own video proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'video-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own video proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'video-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Leaderboard owners can view all video proofs for their leaderboards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'video-proofs' AND 
  EXISTS (
    SELECT 1 FROM public.submissions s 
    JOIN public.leaderboards l ON s.leaderboard_id = l.id 
    WHERE l.owner_user_id = auth.uid() 
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Update submission policies to work with leaderboards
DROP POLICY IF EXISTS "Authenticated can create submissions for self" ON public.submissions;
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;

CREATE POLICY "Users can create submissions for leaderboards" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view approved submissions" 
ON public.submissions 
FOR SELECT 
USING (status = 'APPROVED'::submission_status);

CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Leaderboard owners can manage submissions" 
ON public.submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l 
    WHERE l.id = leaderboard_id AND l.owner_user_id = auth.uid()
  )
);

-- Create function to get submission counts for leaderboards
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats(leaderboard_uuid UUID)
RETURNS TABLE (
  total_submissions BIGINT,
  pending_submissions BIGINT,
  approved_submissions BIGINT,
  unique_participants BIGINT
) 
LANGUAGE sql 
STABLE 
AS $$
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_submissions,
    COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_submissions,
    COUNT(DISTINCT user_id) as unique_participants
  FROM public.submissions 
  WHERE leaderboard_id = leaderboard_uuid;
$$;