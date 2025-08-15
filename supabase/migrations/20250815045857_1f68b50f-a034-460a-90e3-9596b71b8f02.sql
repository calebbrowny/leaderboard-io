-- Complete security fix: Ensure zero public access to sensitive submission data

-- Additional security: Revoke all default grants on submissions table
REVOKE ALL ON public.submissions FROM anon;
REVOKE ALL ON public.submissions FROM authenticated;

-- Also secure the subscribers table completely
REVOKE ALL ON public.subscribers FROM anon;

-- Secure user_roles table
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;

-- Add explicit policy to prevent any anonymous access to submissions
CREATE POLICY "Block anonymous access to submissions" 
ON public.submissions 
FOR ALL 
TO anon
USING (false);

-- Add explicit policy to prevent any anonymous access to subscribers
CREATE POLICY "Block anonymous access to subscribers" 
ON public.subscribers 
FOR ALL 
TO anon
USING (false);

-- Secure user_roles from public access
CREATE POLICY "Block public access to user roles" 
ON public.user_roles 
FOR SELECT 
USING (false);

-- Ensure our public_submissions view is the ONLY way to access submission data publicly
-- and it only shows non-sensitive information
COMMENT ON VIEW public.public_submissions IS 'Secure view that exposes only non-sensitive submission data for public leaderboards. Email addresses and full names are hidden for privacy.';

-- Verify the view is working correctly by ensuring it only shows approved submissions with anonymized data
-- This query should show only display_name (initials) and never full_name or email