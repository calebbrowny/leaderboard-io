-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats(leaderboard_uuid UUID)
RETURNS TABLE (
  total_submissions BIGINT,
  pending_submissions BIGINT,
  approved_submissions BIGINT,
  unique_participants BIGINT
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_submissions,
    COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_submissions,
    COUNT(DISTINCT user_id) as unique_participants
  FROM public.submissions 
  WHERE leaderboard_id = leaderboard_uuid;
$$;