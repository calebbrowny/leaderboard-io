-- Fix submissions INSERT policy - make it completely open for submissions
-- Drop the problematic policy and recreate a working one
DROP POLICY IF EXISTS "public_insert_only" ON public.submissions;

-- Create a simple INSERT policy that allows everyone to submit
CREATE POLICY "allow_all_inserts"
ON public.submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Also ensure SELECT works for approved submissions
DROP POLICY IF EXISTS "public_select_approved" ON public.submissions;
CREATE POLICY "public_select_approved"
ON public.submissions
FOR SELECT
TO public
USING (status = 'APPROVED'::submission_status);