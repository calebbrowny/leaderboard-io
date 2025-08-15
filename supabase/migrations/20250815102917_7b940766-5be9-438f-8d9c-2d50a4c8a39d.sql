-- Fix RLS policies to allow anonymous submissions (error 42501)
-- Drop existing INSERT policies that only work for 'public' role
DROP POLICY IF EXISTS "allow_all_inserts" ON public.submissions;
DROP POLICY IF EXISTS "allow_all_submissions" ON public.submissions; 
DROP POLICY IF EXISTS "completely_open_insert" ON public.submissions;

-- Create new policy that explicitly covers both anonymous and authenticated users
CREATE POLICY "anon_and_auth_can_insert_submissions" 
ON public.submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);