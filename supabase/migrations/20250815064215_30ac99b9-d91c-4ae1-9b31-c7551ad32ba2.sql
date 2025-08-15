-- COMPREHENSIVE FIX: Clean up all conflicting policies

-- Step 1: Drop ALL existing storage policies that might conflict
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload proof files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload video files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to proof files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to video files" ON storage.objects;

-- Step 2: Create simple, permissive storage policies
CREATE POLICY "Anyone can upload to proofs bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated, anon
WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "Anyone can upload to video-proofs bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated, anon
WITH CHECK (bucket_id = 'video-proofs');

CREATE POLICY "Anyone can view proof files" 
ON storage.objects 
FOR SELECT 
TO authenticated, anon
USING (bucket_id IN ('proofs', 'video-proofs'));

-- Step 3: Clean up submissions table policies
DROP POLICY IF EXISTS "Allow all submissions with optional user_id" ON public.submissions;
DROP POLICY IF EXISTS "Allow all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow authenticated submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow anonymous submissions" ON public.submissions;

-- Step 4: Create ONE simple submissions insert policy
CREATE POLICY "Anyone can submit to leaderboards" 
ON public.submissions 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Keep existing select policies for viewing submissions
-- (These are needed for leaderboard owners and users to view their data)