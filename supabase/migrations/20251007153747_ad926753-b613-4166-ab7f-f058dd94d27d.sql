-- Fix RLS policies for players table to allow organisators to create players
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Players can view limited player data" ON public.players;

-- Create comprehensive policies
CREATE POLICY "Organisators and admins can insert players"
ON public.players
FOR INSERT
TO authenticated
WITH CHECK (
  user_has_role_or_higher(auth.uid(), 'organisator'::app_role)
);

CREATE POLICY "Everyone with speler role can view players"
ON public.players
FOR SELECT
TO authenticated
USING (
  user_has_role_or_higher(auth.uid(), 'speler'::app_role)
);