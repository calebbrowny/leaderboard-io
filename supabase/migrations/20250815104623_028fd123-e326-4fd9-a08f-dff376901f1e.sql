-- Enable anonymous submissions and uploads
-- Make user_id nullable for anonymous submissions
ALTER TABLE public.submissions ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous users to insert submissions
CREATE POLICY "anon_insert_submissions" 
ON public.submissions 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to read submissions
CREATE POLICY "anon_select_submissions" 
ON public.submissions 
FOR SELECT 
TO anon 
USING (true);

-- Allow anonymous uploads to proofs bucket (must start with 'anonymous/')
CREATE POLICY "anon_upload_proofs" 
ON storage.objects 
FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'proofs' AND position('anonymous/' in name) = 1);

-- Allow public read access to proofs bucket
CREATE POLICY "public_read_proofs" 
ON storage.objects 
FOR SELECT 
TO anon 
USING (bucket_id = 'proofs');