-- Allow anonymous submissions by updating the RLS policy
DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;

-- Create new policy that allows both authenticated and anonymous submissions
CREATE POLICY "Allow all submissions with optional user_id" 
ON public.submissions 
FOR INSERT 
WITH CHECK (
  -- If user_id is provided, it must match the authenticated user
  (user_id IS NULL) OR (auth.uid() = user_id)
);