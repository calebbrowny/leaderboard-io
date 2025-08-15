-- Remove verification system and add manual ranking support
-- Update leaderboards table to remove verification fields
ALTER TABLE public.leaderboards 
DROP COLUMN IF EXISTS requires_verification,
DROP COLUMN IF EXISTS auto_approve;

-- Add manual ranking support to submissions
ALTER TABLE public.submissions 
ADD COLUMN manual_rank INTEGER,
ADD COLUMN is_manual_entry BOOLEAN DEFAULT false;

-- Update default status for new submissions to be auto-approved
ALTER TABLE public.submissions 
ALTER COLUMN status SET DEFAULT 'APPROVED'::submission_status;

-- Update existing pending submissions to approved
UPDATE public.submissions 
SET status = 'APPROVED'::submission_status, 
    approved_at = NOW()
WHERE status = 'PENDING'::submission_status;