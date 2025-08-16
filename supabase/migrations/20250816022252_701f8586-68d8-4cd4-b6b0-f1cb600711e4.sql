-- Fix function search_path security warnings
ALTER FUNCTION public.validate_submission_input(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.validate_submission_before_save() SET search_path = public;