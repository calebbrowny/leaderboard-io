-- Fix Security Definer View issue: Replace public_submissions view with secure implementation

-- Drop the current insecure view
DROP VIEW IF EXISTS public.public_submissions;

-- Create a new secure view that respects RLS policies
-- This view will only show approved submissions and will respect the underlying table's RLS
CREATE VIEW public.public_submissions AS
SELECT 
  id,
  leaderboard_id,
  CASE
    WHEN length(full_name) > 0 THEN 
      SUBSTRING(full_name FROM 1 FOR 1) ||
      CASE
        WHEN POSITION(' ' IN full_name) > 0 THEN 
          '. ' || SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1 FOR 1) || '.'
        ELSE '.'
      END
    ELSE 'Anonymous'
  END AS display_name,
  gender,
  value_raw,
  value_display,
  status,
  submitted_at,
  approved_at,
  proof_url,
  video_url
FROM submissions
WHERE status = 'APPROVED';

-- Enable RLS on the view (this makes it respect the underlying table's RLS)
ALTER VIEW public.public_submissions SET (security_invoker = true);

-- Grant appropriate permissions
-- Note: The view will now respect the RLS policies of the underlying submissions table
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;

-- Add a policy to allow public access to this view for approved submissions only
-- Since this is a public leaderboard view, we want anyone to see approved submissions
CREATE POLICY "Allow public access to approved submissions view" 
ON public.submissions 
FOR SELECT 
TO anon, authenticated
USING (status = 'APPROVED');

-- Add comment explaining the security model
COMMENT ON VIEW public.public_submissions IS 
'SECURE VIEW: Shows only approved submissions with anonymized display names. Uses security_invoker to respect RLS policies of underlying table.';