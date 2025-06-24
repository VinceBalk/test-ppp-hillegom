
-- Fix critical security issues identified in the security review

-- 1. Fix the broken is_super_admin function that's causing recursion
DROP FUNCTION IF EXISTS public.is_super_admin();

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = $1 AND is_super_admin = TRUE
  );
$function$;

-- 2. Drop all existing conflicting RLS policies to start clean
DROP POLICY IF EXISTS "Super admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;

DROP POLICY IF EXISTS "System can log login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Super admins can view login attempts" ON public.login_attempts;

DROP POLICY IF EXISTS "All authenticated users can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.security_audit_log;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

-- 3. Create comprehensive RLS policies for admin_users table
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

-- 4. Create RLS policies for login_attempts table
CREATE POLICY "System can log login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 5. Create RLS policies for security_audit_log table
CREATE POLICY "All authenticated users can insert audit logs" 
  ON public.security_audit_log 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can view all audit logs" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (public.is_super_admin(auth.uid()));

-- 6. Create RLS policies for user_sessions table
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON public.user_sessions
  FOR ALL
  USING (true);

-- 7. Ensure vincebalk@gmail.com is properly set up as super admin
INSERT INTO public.admin_users (email, is_super_admin)
SELECT 'vincebalk@gmail.com', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'vincebalk@gmail.com'
);

-- Update the profile role for vincebalk@gmail.com
UPDATE public.profiles 
SET role = 'beheerder' 
WHERE email = 'vincebalk@gmail.com';
