
-- Phase 1: Enhanced Database Security and Monitoring

-- 1. Create comprehensive security events enum
CREATE TYPE public.security_event_type AS ENUM (
  'login_attempt',
  'password_change',
  'role_change',
  'data_access_violation',
  'suspicious_activity',
  'admin_action',
  'system_event'
);

-- 2. Add event_type column to security_audit_log with proper constraint
ALTER TABLE public.security_audit_log 
ADD COLUMN IF NOT EXISTS event_type public.security_event_type DEFAULT 'system_event';

-- 3. Create indexes for better query performance on audit logs
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON public.security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);

-- 4. Create session tracking table for enhanced monitoring
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for session tracking
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON public.user_sessions
  FOR ALL
  USING (true);

-- 5. Enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_comprehensive_security_event(
  p_user_id uuid,
  p_event_type public.security_event_type,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_risk_level text DEFAULT 'low',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.security_audit_log (
    user_id, event_type, action, resource_type, resource_id, 
    details, risk_level, ip_address, user_agent
  ) VALUES (
    p_user_id, p_event_type, p_action, p_resource_type, p_resource_id, 
    p_details, p_risk_level, p_ip_address, p_user_agent
  );
$$;

-- 6. Create function to track suspicious patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_login_patterns(
  p_email text,
  p_ip_address inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_failures integer;
  different_ips integer;
  rapid_attempts integer;
  result jsonb;
BEGIN
  -- Check failed attempts in last hour
  SELECT COUNT(*)
  INTO recent_failures
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '1 hour'
    AND success = FALSE;

  -- Check attempts from different IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address)
  INTO different_ips
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;

  -- Check rapid attempts in last 5 minutes
  SELECT COUNT(*)
  INTO rapid_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '5 minutes';

  result := jsonb_build_object(
    'recent_failures', recent_failures,
    'different_ips', different_ips,
    'rapid_attempts', rapid_attempts,
    'is_suspicious', (recent_failures > 5 OR different_ips > 3 OR rapid_attempts > 10)
  );

  RETURN result;
END;
$$;

-- 7. Create function to clean old audit logs (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_days_to_keep integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::interval
    AND risk_level IN ('low', 'medium'); -- Keep high and critical logs longer

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
