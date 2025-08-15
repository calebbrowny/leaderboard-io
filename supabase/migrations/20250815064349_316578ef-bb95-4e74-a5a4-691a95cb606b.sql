-- EMERGENCY FIX: Drop ALL policies on submissions and recreate properly

-- Drop ALL existing policies on submissions table
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Owners can view leaderboard submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
DROP POLICY IF EXISTS "Owners can update leaderboard submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public access to approved submissions view" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can submit to leaderboards" ON public.submissions;

-- Create fresh, simple policies
CREATE POLICY "Allow anyone to insert submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow viewing approved submissions" 
ON public.submissions 
FOR SELECT 
USING (status = 'APPROVED');

CREATE POLICY "Leaderboard owners can view all submissions" 
ON public.submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM leaderboards l 
  WHERE l.id = submissions.leaderboard_id 
  AND l.owner_user_id = auth.uid()
));

CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Leaderboard owners can update submissions" 
ON public.submissions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM leaderboards l 
  WHERE l.id = submissions.leaderboard_id 
  AND l.owner_user_id = auth.uid()
));