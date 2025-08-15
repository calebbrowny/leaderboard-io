-- Remove verification system completely
-- Set all submissions to APPROVED status by default
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'APPROVED'::submission_status;

-- Update any existing PENDING submissions to APPROVED
UPDATE public.submissions SET status = 'APPROVED' WHERE status = 'PENDING';

-- Remove verification-related columns from leaderboards table
ALTER TABLE public.leaderboards DROP COLUMN IF EXISTS requires_verification;
ALTER TABLE public.leaderboards DROP COLUMN IF EXISTS auto_approve;