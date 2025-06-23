
-- Zorg ervoor dat vincebalk@gmail.com als super admin is geregistreerd
INSERT INTO public.admin_users (email, user_id, is_super_admin)
SELECT 'vincebalk@gmail.com', auth.uid(), true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = 'vincebalk@gmail.com' AND is_super_admin = true
);

-- Update RLS policies voor courts table
DROP POLICY IF EXISTS "Everyone can view courts" ON public.courts;
DROP POLICY IF EXISTS "Organisators and super admins can manage courts" ON public.courts;

CREATE POLICY "Everyone can view courts" 
  ON public.courts 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage courts" 
  ON public.courts 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update RLS policies voor match_specials table
DROP POLICY IF EXISTS "Everyone can view match specials" ON public.match_specials;
DROP POLICY IF EXISTS "Organisators and super admins can manage match specials" ON public.match_specials;

CREATE POLICY "Everyone can view match specials" 
  ON public.match_specials 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage match specials" 
  ON public.match_specials 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update RLS policies voor tournament_rounds table
DROP POLICY IF EXISTS "Everyone can view tournament rounds" ON public.tournament_rounds;
DROP POLICY IF EXISTS "Organisators and super admins can manage tournament rounds" ON public.tournament_rounds;

CREATE POLICY "Everyone can view tournament rounds" 
  ON public.tournament_rounds 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage tournament rounds" 
  ON public.tournament_rounds 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update RLS policies voor tournament_schedule_previews table
DROP POLICY IF EXISTS "Everyone can view schedule previews" ON public.tournament_schedule_previews;
DROP POLICY IF EXISTS "Organisators and super admins can manage schedule previews" ON public.tournament_schedule_previews;

CREATE POLICY "Everyone can view schedule previews" 
  ON public.tournament_schedule_previews 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage schedule previews" 
  ON public.tournament_schedule_previews 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Zorg ervoor dat vincebalk@gmail.com als beheerder profiel heeft
UPDATE public.profiles 
SET role = 'beheerder' 
WHERE email = 'vincebalk@gmail.com';

-- Insert vincebalk@gmail.com als admin user record als deze nog niet bestaat
INSERT INTO public.admin_users (email, is_super_admin)
SELECT 'vincebalk@gmail.com', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'vincebalk@gmail.com'
);
