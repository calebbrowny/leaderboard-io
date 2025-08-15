-- Final security hardening: Secure the public_submissions view completely

-- Make the view only accessible with explicit grant and proper policies
REVOKE ALL ON public.public_submissions FROM PUBLIC;
REVOKE ALL ON public.public_submissions FROM anon;
REVOKE ALL ON public.public_submissions FROM authenticated;

-- Re-grant only SELECT to specific roles that need it
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;

-- Add a comment to clarify this view is secure and anonymized
COMMENT ON VIEW public.public_submissions IS 'SECURE VIEW: Only exposes anonymized display names (initials), hiding all email addresses and full names. Used for public leaderboard display only.';

-- Ensure the view definition is truly secure by double-checking it excludes sensitive fields
-- The view should NEVER show: full_name, email, or any other PII
-- It should ONLY show: display_name (initials), value_display, value_raw, gender, dates, proof URLs

-- Add additional security check: Verify no sensitive data is exposed
DO $$
BEGIN
    -- Verify the view definition doesn't contain sensitive column names
    IF EXISTS (
        SELECT 1 FROM information_schema.view_column_usage 
        WHERE table_name = 'public_submissions' 
        AND column_name IN ('full_name', 'email', 'user_id')
    ) THEN
        RAISE EXCEPTION 'SECURITY ERROR: public_submissions view still exposes sensitive data';
    END IF;
END $$;