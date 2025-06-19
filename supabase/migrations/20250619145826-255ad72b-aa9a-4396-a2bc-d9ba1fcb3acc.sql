
-- Fix Critical RLS Policy Gaps for profiles table
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);

-- Create a security definer function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create a function to check if user has required role or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(user_id uuid, required_role text)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN required_role = 'speler' THEN 
      public.get_user_role(user_id) IN ('speler', 'organisator', 'beheerder')
    WHEN required_role = 'organisator' THEN 
      public.get_user_role(user_id) IN ('organisator', 'beheerder')
    WHEN required_role = 'beheerder' THEN 
      public.get_user_role(user_id) = 'beheerder'
    ELSE FALSE
  END;
$$;

-- Create admin_users table to manage super admins more securely
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_super_admin = TRUE
    )
  );

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = $1 AND is_super_admin = TRUE
  );
$$;

-- Insert the initial super admin (vincebalk@gmail.com)
INSERT INTO public.admin_users (user_id, email, is_super_admin, created_at)
SELECT 
  u.id, 
  u.email, 
  TRUE, 
  NOW()
FROM auth.users u 
WHERE u.email = 'vincebalk@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Update the handle_new_user function to check admin_users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = NEW.email AND is_super_admin = TRUE
      ) THEN 'beheerder'
      ELSE 'speler'
    END
  );
  RETURN NEW;
END;
$$;

-- Create audit log table for security monitoring
CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log (only super admins can view)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (public.is_super_admin(auth.uid()));

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details
  );
$$;
