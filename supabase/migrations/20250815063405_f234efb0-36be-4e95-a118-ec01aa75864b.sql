-- Fix the INSERT policy to work for authenticated users
DROP POLICY IF EXISTS "Allow all submissions with optional user_id" ON public.submissions;

-- Create policy that works for both authenticated and anonymous users
CREATE POLICY "Allow all submissions with optional user_id" 
ON public.submissions 
FOR INSERT 
TO authenticated, anon
WITH CHECK (
  -- If user_id is provided, it must match the authenticated user
  (user_id IS NULL) OR (auth.uid() = user_id)
);