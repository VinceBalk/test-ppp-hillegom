
-- Phase 1: Enable RLS and create secure policies for all main tables (Final Fixed Version)

-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tournament_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
-- Admin users policies
DROP POLICY IF EXISTS "Super admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Courts policies
DROP POLICY IF EXISTS "Users can view courts" ON public.courts;
DROP POLICY IF EXISTS "Organisators can manage courts" ON public.courts;

-- Login attempts policies
DROP POLICY IF EXISTS "System can log login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Super admins can view login attempts" ON public.login_attempts;

-- Match specials policies
DROP POLICY IF EXISTS "Users can view match specials" ON public.match_specials;
DROP POLICY IF EXISTS "Organisators can manage match specials" ON public.match_specials;

-- Matches policies
DROP POLICY IF EXISTS "Users can view matches" ON public.matches;
DROP POLICY IF EXISTS "Organisators can manage matches" ON public.matches;
DROP POLICY IF EXISTS "Everyone can view matches" ON public.matches;
DROP POLICY IF EXISTS "Organisators and admins can create matches" ON public.matches;
DROP POLICY IF EXISTS "Organisators and admins can update matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON public.matches;

-- Player movements policies
DROP POLICY IF EXISTS "Users can view player movements" ON public.player_movements;
DROP POLICY IF EXISTS "Organisators can manage player movements" ON public.player_movements;

-- Player tournament stats policies
DROP POLICY IF EXISTS "Users can view player tournament stats" ON public.player_tournament_stats;
DROP POLICY IF EXISTS "Organisators can manage player tournament stats" ON public.player_tournament_stats;

-- Players policies
DROP POLICY IF EXISTS "Users can view players" ON public.players;
DROP POLICY IF EXISTS "Organisators can manage players" ON public.players;
DROP POLICY IF EXISTS "Organisators and beheerders can manage players" ON public.players;
DROP POLICY IF EXISTS "Spelers can view players" ON public.players;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles during registration" ON public.profiles;

-- Security audit log policies
DROP POLICY IF EXISTS "All authenticated users can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.security_audit_log;

-- Settings policies
DROP POLICY IF EXISTS "Only super admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Only admins can modify settings" ON public.settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Only admins can delete settings" ON public.settings;

-- Special types policies
DROP POLICY IF EXISTS "Users can view special types" ON public.special_types;
DROP POLICY IF EXISTS "Organisators can manage special types" ON public.special_types;

-- Specials policies
DROP POLICY IF EXISTS "Users can view specials" ON public.specials;
DROP POLICY IF EXISTS "Organisators can manage specials" ON public.specials;
DROP POLICY IF EXISTS "Everyone can view specials" ON public.specials;
DROP POLICY IF EXISTS "Organisators and admins can create specials" ON public.specials;
DROP POLICY IF EXISTS "Organisators and admins can update specials" ON public.specials;
DROP POLICY IF EXISTS "Admins can delete specials" ON public.specials;

-- Tournament players policies
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Organisators can manage tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Anyone can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can add tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can update tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Authenticated users can delete tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Everyone can view tournament registrations" ON public.tournament_players;
DROP POLICY IF EXISTS "Players can register themselves" ON public.tournament_players;
DROP POLICY IF EXISTS "Organisators and admins can manage registrations" ON public.tournament_players;
DROP POLICY IF EXISTS "Organisators and admins can delete registrations" ON public.tournament_players;

-- Tournament rounds policies
DROP POLICY IF EXISTS "Users can view tournament rounds" ON public.tournament_rounds;
DROP POLICY IF EXISTS "Organisators can manage tournament rounds" ON public.tournament_rounds;

-- Tournaments policies
DROP POLICY IF EXISTS "Users can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Organisators can manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Organisators and beheerders can manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Spelers can view tournaments" ON public.tournaments;

-- User sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

-- Now create all policies from scratch

-- Admin users policies (only super admins can manage)
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

-- Courts policies
CREATE POLICY "Users can view courts" 
  ON public.courts 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage courts" 
  ON public.courts 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Login attempts policies
CREATE POLICY "System can log login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Match specials policies
CREATE POLICY "Users can view match specials" 
  ON public.match_specials 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage match specials" 
  ON public.match_specials 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Matches policies
CREATE POLICY "Users can view matches" 
  ON public.matches 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage matches" 
  ON public.matches 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Player movements policies
CREATE POLICY "Users can view player movements" 
  ON public.player_movements 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage player movements" 
  ON public.player_movements 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Player tournament stats policies
CREATE POLICY "Users can view player tournament stats" 
  ON public.player_tournament_stats 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage player tournament stats" 
  ON public.player_tournament_stats 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Players policies
CREATE POLICY "Users can view players" 
  ON public.players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage players" 
  ON public.players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Profiles policies (users can only see their own profile, admins can see all)
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id OR public.has_role_or_higher(auth.uid(), 'beheerder'));

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id OR public.has_role_or_higher(auth.uid(), 'beheerder'));

CREATE POLICY "System can insert profiles during registration" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id OR public.is_super_admin(auth.uid()));

-- Security audit log policies
CREATE POLICY "All authenticated users can insert audit logs" 
  ON public.security_audit_log 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can view all audit logs" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (public.is_super_admin(auth.uid()));

-- Settings policies (only super admins)
CREATE POLICY "Only super admins can manage settings" 
  ON public.settings 
  FOR ALL 
  USING (public.is_super_admin(auth.uid()));

-- Special types policies
CREATE POLICY "Users can view special types" 
  ON public.special_types 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage special types" 
  ON public.special_types 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Specials policies
CREATE POLICY "Users can view specials" 
  ON public.specials 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage specials" 
  ON public.specials 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Tournament players policies
CREATE POLICY "Users can view tournament players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage tournament players" 
  ON public.tournament_players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Tournament rounds policies
CREATE POLICY "Users can view tournament rounds" 
  ON public.tournament_rounds 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage tournament rounds" 
  ON public.tournament_rounds 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- Tournaments policies
CREATE POLICY "Users can view tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

CREATE POLICY "Organisators can manage tournaments" 
  ON public.tournaments 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

-- User sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON public.user_sessions
  FOR ALL
  USING (true);

-- Create additional security functions for enhanced validation
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND length(email) <= 254 
    AND length(email) >= 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_user_input(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially dangerous characters
  RETURN regexp_replace(
    regexp_replace(input, '[<>"\''&]', '', 'g'),
    '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g'
  );
END;
$$;
