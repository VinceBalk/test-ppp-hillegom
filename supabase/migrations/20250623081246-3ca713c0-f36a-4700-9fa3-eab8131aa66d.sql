
-- Fix RLS policies for super admins to see everything
-- Update matches policies to allow super admins full access
DROP POLICY IF EXISTS "Users can view matches" ON public.matches;
DROP POLICY IF EXISTS "Organisators can manage matches" ON public.matches;

CREATE POLICY "Everyone can view matches" 
  ON public.matches 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage matches" 
  ON public.matches 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update tournaments policies for super admins
DROP POLICY IF EXISTS "Users can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Organisators can manage tournaments" ON public.tournaments;

CREATE POLICY "Everyone can view tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage tournaments" 
  ON public.tournaments 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update tournament_players policies
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Organisators can manage tournament players" ON public.tournament_players;

CREATE POLICY "Everyone can view tournament players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage tournament players" 
  ON public.tournament_players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update players policies
DROP POLICY IF EXISTS "Users can view players" ON public.players;
DROP POLICY IF EXISTS "Organisators can manage players" ON public.players;

CREATE POLICY "Everyone can view players" 
  ON public.players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage players" 
  ON public.players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Add some test data if none exists
-- Insert test tournaments if they don't exist
INSERT INTO public.tournaments (name, start_date, end_date, status, description, max_players)
SELECT 'Test Toernooi 1', CURRENT_DATE, CURRENT_DATE + 1, 'active', 'Test toernooi voor ontwikkeling', 16
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments LIMIT 1);

INSERT INTO public.tournaments (name, start_date, end_date, status, description, max_players)
SELECT 'Test Toernooi 2', CURRENT_DATE + 7, CURRENT_DATE + 8, 'draft', 'Tweede test toernooi', 12
WHERE (SELECT COUNT(*) FROM public.tournaments) < 2;

-- Insert test players if they don't exist
INSERT INTO public.players (name, email, phone)
SELECT 'Test Speler 1', 'speler1@test.nl', '06-12345678'
WHERE NOT EXISTS (SELECT 1 FROM public.players LIMIT 1);

INSERT INTO public.players (name, email, phone)
SELECT 'Test Speler 2', 'speler2@test.nl', '06-87654321'
WHERE (SELECT COUNT(*) FROM public.players) < 2;

INSERT INTO public.players (name, email, phone)
SELECT 'Test Speler 3', 'speler3@test.nl', '06-11111111'
WHERE (SELECT COUNT(*) FROM public.players) < 3;

INSERT INTO public.players (name, email, phone)
SELECT 'Test Speler 4', 'speler4@test.nl', '06-22222222'
WHERE (SELECT COUNT(*) FROM public.players) < 4;

-- Insert test courts if they don't exist
INSERT INTO public.courts (name, is_active)
SELECT 'Baan 1 Links', true
WHERE NOT EXISTS (SELECT 1 FROM public.courts LIMIT 1);

INSERT INTO public.courts (name, is_active)
SELECT 'Baan 2 Links', true
WHERE (SELECT COUNT(*) FROM public.courts) < 2;

INSERT INTO public.courts (name, is_active)
SELECT 'Baan 1 Rechts', true
WHERE (SELECT COUNT(*) FROM public.courts) < 3;

INSERT INTO public.courts (name, is_active)
SELECT 'Baan 2 Rechts', true
WHERE (SELECT COUNT(*) FROM public.courts) < 4;
