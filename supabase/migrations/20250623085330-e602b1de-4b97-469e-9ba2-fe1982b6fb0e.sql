
-- Controleer en update RLS policies voor alle relevante tabellen

-- Zorg ervoor dat vincebalk@gmail.com als super admin is geregistreerd
INSERT INTO public.admin_users (email, user_id, is_super_admin)
SELECT 'vincebalk@gmail.com', auth.uid(), true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = 'vincebalk@gmail.com' AND is_super_admin = true
);

-- Update matches policies
DROP POLICY IF EXISTS "Everyone can view matches" ON public.matches;
DROP POLICY IF EXISTS "Organisators and super admins can manage matches" ON public.matches;

CREATE POLICY "Users can view relevant matches" 
  ON public.matches 
  FOR SELECT 
  USING (
    public.is_super_admin(auth.uid()) OR
    public.has_role_or_higher(auth.uid(), 'organisator') OR
    (
      public.has_role_or_higher(auth.uid(), 'speler') AND (
        player1_id = auth.uid() OR 
        player2_id = auth.uid() OR
        team1_player1_id = auth.uid() OR
        team1_player2_id = auth.uid() OR
        team2_player1_id = auth.uid() OR
        team2_player2_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organisators and super admins can manage matches" 
  ON public.matches 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update tournaments policies
DROP POLICY IF EXISTS "Everyone can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Organisators and super admins can manage tournaments" ON public.tournaments;

CREATE POLICY "Everyone can view tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage tournaments" 
  ON public.tournaments 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Update players policies to allow players to see all other players (for match viewing)
DROP POLICY IF EXISTS "Everyone can view players" ON public.players;
DROP POLICY IF EXISTS "Organisators and super admins can manage players" ON public.players;

CREATE POLICY "Everyone can view players" 
  ON public.players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Organisators and super admins can manage players" 
  ON public.players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator') OR public.is_super_admin(auth.uid()));

-- Zorg ervoor dat vincebalk@gmail.com de juiste rol heeft in profiles
UPDATE public.profiles 
SET role = 'beheerder' 
WHERE email = 'vincebalk@gmail.com';

-- Insert vincebalk@gmail.com als admin user record als deze nog niet bestaat
INSERT INTO public.admin_users (email, is_super_admin)
SELECT 'vincebalk@gmail.com', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'vincebalk@gmail.com'
);
