-- =====================================================
-- CRITICAL SECURITY FIX: Separate User Roles Table
-- =====================================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('speler', 'organisator', 'beheerder');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create SECURITY DEFINER functions for role checking
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role_or_higher(_user_id UUID, _required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _required_role = 'speler' THEN 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('speler', 'organisator', 'beheerder'))
    WHEN _required_role = 'organisator' THEN 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('organisator', 'beheerder'))
    WHEN _required_role = 'beheerder' THEN 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'beheerder')
    ELSE FALSE
  END;
$$;

-- 4. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, role::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Add RLS policies for user_roles table
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- FIX: Restrict Player PII Access
-- =====================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Everyone can view players" ON public.players;

-- Create restricted policies
CREATE POLICY "Organizers and admins can view all player data"
ON public.players FOR SELECT
USING (user_has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Players can view limited player data"
ON public.players FOR SELECT
USING (
  user_has_role_or_higher(auth.uid(), 'speler')
  AND (
    -- Can see their own full data
    created_by = auth.uid()
    -- Or can see others' data without PII (handled in application layer)
  )
);

-- =====================================================
-- FIX: Tournament Schedule Previews Authorization
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can create tournament schedule previews" ON public.tournament_schedule_previews;
DROP POLICY IF EXISTS "Users can update tournament schedule previews" ON public.tournament_schedule_previews;
DROP POLICY IF EXISTS "Users can delete tournament schedule previews" ON public.tournament_schedule_previews;
DROP POLICY IF EXISTS "Users can view tournament schedule previews" ON public.tournament_schedule_previews;

-- Add proper authorization
CREATE POLICY "Organizers can manage schedule previews"
ON public.tournament_schedule_previews FOR ALL
USING (user_has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Players can view schedule previews"
ON public.tournament_schedule_previews FOR SELECT
USING (user_has_role_or_higher(auth.uid(), 'speler'));

-- =====================================================
-- FIX: Add Server-Side Input Validation
-- =====================================================

-- Email validation function (already exists, ensuring it's proper)
CREATE OR REPLACE FUNCTION public.validate_email_format(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF email IS NULL THEN
    RETURN TRUE; -- Allow NULL emails
  END IF;
  
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND length(email) <= 254 
    AND length(email) >= 5;
END;
$$;

-- Input sanitization function (already exists, ensuring it's proper)
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
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

-- Clean up invalid emails before adding constraint
UPDATE public.players
SET email = NULL
WHERE email IS NOT NULL 
  AND NOT (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND length(email) <= 254 
    AND length(email) >= 5
  );

-- Add check constraints for player data
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS check_name_format;
ALTER TABLE public.players 
ADD CONSTRAINT check_name_format 
CHECK (length(name) > 0 AND length(name) <= 100);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS check_email_format;
ALTER TABLE public.players
ADD CONSTRAINT check_email_format
CHECK (email IS NULL OR validate_email_format(email));

-- =====================================================
-- FIX: Add Authorization to SECURITY DEFINER Functions  
-- =====================================================

-- Update save_individual_match to include authorization check
CREATE OR REPLACE FUNCTION public.save_individual_match(
  p_match_id UUID,
  p_team1_player1_id UUID,
  p_team1_player2_id UUID,
  p_team2_player1_id UUID,
  p_team2_player2_id UUID,
  p_court_id UUID DEFAULT NULL,
  p_court_number TEXT DEFAULT NULL,
  p_round_within_group INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_match JSON;
BEGIN
  -- Authorization check
  IF NOT user_has_role_or_higher(auth.uid(), 'organisator') THEN
    RAISE EXCEPTION 'Unauthorized: organizer role required';
  END IF;

  -- Update de wedstrijd met nieuwe gegevens
  UPDATE public.matches
  SET 
    team1_player1_id = p_team1_player1_id,
    team1_player2_id = p_team1_player2_id,
    team2_player1_id = p_team2_player1_id,
    team2_player2_id = p_team2_player2_id,
    court_id = p_court_id,
    court_number = p_court_number,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Haal de bijgewerkte wedstrijd op met alle gerelateerde data
  SELECT row_to_json(match_data) INTO result_match
  FROM (
    SELECT 
      m.*,
      t.name as tournament_name,
      tp1.name as team1_player1_name,
      tp2.name as team1_player2_name,
      tp3.name as team2_player1_name,
      tp4.name as team2_player2_name,
      c.name as court_name
    FROM public.matches m
    LEFT JOIN public.tournaments t ON m.tournament_id = t.id
    LEFT JOIN public.players tp1 ON m.team1_player1_id = tp1.id
    LEFT JOIN public.players tp2 ON m.team1_player2_id = tp2.id
    LEFT JOIN public.players tp3 ON m.team2_player1_id = tp3.id
    LEFT JOIN public.players tp4 ON m.team2_player2_id = tp4.id
    LEFT JOIN public.courts c ON m.court_id = c.id
    WHERE m.id = p_match_id
  ) match_data;

  RETURN result_match;
END;
$$;