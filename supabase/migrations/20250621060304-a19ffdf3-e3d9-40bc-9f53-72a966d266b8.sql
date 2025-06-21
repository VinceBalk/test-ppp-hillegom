
-- Phase 1: Fix Critical RLS Policy Gaps and Conflicts (Fixed Version)

-- 1. Drop ALL existing policies on admin_users to start clean
DROP POLICY IF EXISTS "Super admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- 2. Drop conflicting policies on tournament_players
DROP POLICY IF EXISTS "Anyone can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can add tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can update tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can delete tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Organisators can manage tournament players" ON public.tournament_players;

-- 3. Create secure RLS policies for tournament_players
CREATE POLICY "Users can view tournament players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage tournament players" 
  ON public.tournament_players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- 4. Create secure admin_users policies
CREATE POLICY "Super admins can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert admin users" 
  ON public.admin_users 
  FOR INSERT 
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update admin users" 
  ON public.admin_users 
  FOR UPDATE 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete admin users" 
  ON public.admin_users 
  FOR DELETE 
  USING (public.is_super_admin(auth.uid()));

-- 5. Ensure all sensitive tables have proper RLS enabled
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6. Add missing RLS policies for settings table
DROP POLICY IF EXISTS "Only super admins can manage settings" ON public.settings;
CREATE POLICY "Only super admins can manage settings" 
  ON public.settings 
  FOR ALL 
  USING (public.is_super_admin(auth.uid()));

-- 7. Enhance security audit logging
ALTER TABLE public.security_audit_log 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';

-- Add constraint for risk_level if it doesn't exist
DO $$
BEGIN
    ALTER TABLE public.security_audit_log 
    ADD CONSTRAINT security_audit_log_risk_level_check 
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));
EXCEPTION
    WHEN duplicate_object THEN 
        NULL; -- Constraint already exists, ignore
END $$;

-- 8. Create enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_risk_level text DEFAULT 'low'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details, risk_level
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_risk_level
  );
$$;

-- 9. Create rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on login_attempts to avoid conflicts
DROP POLICY IF EXISTS "System can log login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Super admins can view login attempts" ON public.login_attempts;

-- Create policies for login_attempts
CREATE POLICY "System can log login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 10. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email text,
  p_ip_address inet DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_failures integer;
BEGIN
  -- Check failed attempts in last 15 minutes
  SELECT COUNT(*)
  INTO recent_failures
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '15 minutes'
    AND success = FALSE;

  -- Allow if fewer than 5 failed attempts
  RETURN recent_failures < 5;
END;
$$;

-- 11. Create login attempt logging function
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email text,
  p_success boolean,
  p_ip_address inet DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (p_email, p_success, p_ip_address);
$$;
