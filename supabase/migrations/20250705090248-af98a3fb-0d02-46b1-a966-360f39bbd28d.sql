-- Create function to force logout all users by updating all user sessions
CREATE OR REPLACE FUNCTION public.force_logout_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- End all active user sessions
  UPDATE public.user_sessions 
  SET is_active = FALSE, 
      ended_at = NOW()
  WHERE is_active = TRUE;
  
  -- Log the security event
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    action, 
    risk_level,
    details
  ) VALUES (
    auth.uid(),
    'admin_action',
    'force_logout_all_users',
    'high',
    jsonb_build_object('timestamp', NOW(), 'admin_user', auth.uid())
  );
END;
$$;