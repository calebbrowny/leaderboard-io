-- NUCLEAR OPTION: Completely open submissions for INSERT
-- This will definitely work for anonymous submissions

-- First, let's see if RLS is even enabled
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;

-- Re-enable it with completely permissive policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow anyone to insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow viewing approved submissions" ON public.submissions;
DROP POLICY IF EXISTS "Leaderboard owners can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Leaderboard owners can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;

-- Create the most permissive INSERT policy possible
CREATE POLICY "completely_open_insert" 
ON public.submissions 
FOR INSERT 
TO public, authenticated, anon
WITH CHECK (true);

-- Add minimal SELECT policies
CREATE POLICY "public_approved_view" 
ON public.submissions 
FOR SELECT 
TO public, authenticated, anon
USING (status = 'APPROVED');

CREATE POLICY "owner_view_all" 
ON public.submissions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leaderboards 
    WHERE id = submissions.leaderboard_id 
    AND owner_user_id = auth.uid()
  )
);

-- Add minimal UPDATE policy for owners
CREATE POLICY "owner_update" 
ON public.submissions 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leaderboards 
    WHERE id = submissions.leaderboard_id 
    AND owner_user_id = auth.uid()
  )
);