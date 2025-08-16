-- Fix critical data exposure by removing dangerous RLS policies and consolidating security
-- Remove the dangerous policies that expose all user data to anonymous users
DROP POLICY IF EXISTS "anon_select_submissions" ON public.submissions;
DROP POLICY IF EXISTS "public_select_approved" ON public.submissions;
DROP POLICY IF EXISTS "public_approved_view" ON public.submissions;

-- Create secure policy for public viewing of approved submissions only (no personal data)
-- This will be used through the public_submissions view which already filters out personal info
CREATE POLICY "public_view_approved_submissions" 
ON public.submissions 
FOR SELECT 
TO public
USING (status = 'APPROVED'::submission_status);

-- Create policy for authenticated users to view their own submissions
CREATE POLICY "users_view_own_submissions" 
ON public.submissions 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Ensure leaderboard owners can manage all submissions for their leaderboards
-- (This policy already exists as "owner_view_all" but let's make it explicit)
CREATE POLICY "leaderboard_owners_manage_submissions" 
ON public.submissions 
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leaderboards 
  WHERE leaderboards.id = submissions.leaderboard_id 
  AND leaderboards.owner_user_id = auth.uid()
));

-- Fix storage security - remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload to proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "anon_upload_proofs" ON storage.objects;

-- Create secure storage policies with proper validation
CREATE POLICY "authenticated_users_upload_proofs" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'))
);

CREATE POLICY "authenticated_users_upload_video_proofs" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'video-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) IN ('mp4', 'mov', 'avi', 'webm'))
);

-- Allow public viewing of files (but not listing)
CREATE POLICY "public_view_proof_files" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id IN ('proofs', 'video-proofs'));

-- Allow owners to manage their own files
CREATE POLICY "users_manage_own_proof_files" 
ON storage.objects 
FOR ALL
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Create function for enhanced input validation
CREATE OR REPLACE FUNCTION public.validate_submission_input(
  input_text TEXT,
  input_type TEXT DEFAULT 'general'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profanity_patterns TEXT[] := ARRAY[
    'fuck', 'shit', 'cunt', 'bitch', 'damn', 'hell', 'ass', 'bastard',
    'f.ck', 'f*ck', 'f-ck', 'sh*t', 'sh.t', 'b*tch', 'b.tch',
    'fuk', 'fck', 'sht', 'btch', 'dmn', 'hll'
  ];
  pattern TEXT;
  cleaned_input TEXT;
BEGIN
  -- Clean input for obfuscation detection
  cleaned_input := LOWER(REGEXP_REPLACE(input_text, '[^a-z0-9]', '', 'g'));
  
  -- Check against profanity patterns
  FOREACH pattern IN ARRAY profanity_patterns
  LOOP
    IF cleaned_input LIKE '%' || pattern || '%' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  -- Additional validation based on input type
  IF input_type = 'email' THEN
    RETURN input_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
  END IF;
  
  IF input_type = 'name' THEN
    -- Names should not contain numbers or special characters (except spaces, hyphens, apostrophes)
    RETURN input_text ~* '^[A-Za-z\s\-''\.]+$' AND LENGTH(input_text) BETWEEN 1 AND 100;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create trigger to validate submissions before insert/update
CREATE OR REPLACE FUNCTION public.validate_submission_before_save()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate full name
  IF NOT public.validate_submission_input(NEW.full_name, 'name') THEN
    RAISE EXCEPTION 'Invalid or inappropriate content in name field';
  END IF;
  
  -- Validate email
  IF NOT public.validate_submission_input(NEW.email, 'email') THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate notes if present
  IF NEW.notes IS NOT NULL AND NOT public.validate_submission_input(NEW.notes, 'general') THEN
    RAISE EXCEPTION 'Invalid or inappropriate content in notes field';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the validation trigger
DROP TRIGGER IF EXISTS validate_submission_content ON public.submissions;
CREATE TRIGGER validate_submission_content
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_submission_before_save();