-- Remove the public SELECT policy from submissions table that exposes PII
DROP POLICY IF EXISTS "public_view_approved_submissions" ON public.submissions;

-- Ensure only the sanitized public_submissions view is accessible
-- The view already exists and provides safe access to submission data
-- No additional policies needed since views inherit their security from underlying tables