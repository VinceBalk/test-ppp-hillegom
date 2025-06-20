
-- Remove the hardcoded email from RLS policy and create a proper super admin check
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;

-- Create new policy using the existing is_super_admin function
CREATE POLICY "Super admins can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (public.is_super_admin(auth.uid()));

-- Fix the INSERT policy constraint issue by removing the problematic policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a better INSERT policy that works with the trigger
CREATE POLICY "Users can insert their own profile during registration" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id OR public.is_super_admin(auth.uid()));

-- Add missing RLS policies for admin_users table
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

-- Add missing RLS policies for security_audit_log table
CREATE POLICY "All authenticated users can insert audit logs" 
  ON public.security_audit_log 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update existing audit log SELECT policy to be more specific
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.security_audit_log;
CREATE POLICY "Super admins can view all audit logs" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (public.is_super_admin(auth.uid()));
