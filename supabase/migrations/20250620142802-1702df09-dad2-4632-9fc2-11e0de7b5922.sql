
-- Extend players table with ranking and statistics fields
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS total_tournaments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_games_won integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_games_per_tournament numeric(4,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS specials jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS row_side text DEFAULT 'left' CHECK (row_side IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_change integer DEFAULT 0;

-- Create player_movements table for tracking promotions/demotions
CREATE TABLE IF NOT EXISTS public.player_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  from_row text CHECK (from_row IN ('left', 'right')),
  to_row text CHECK (to_row IN ('left', 'right')),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  status text CHECK (status IN ('promotie', 'degradatie', 'gebleven')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on player_movements
ALTER TABLE public.player_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for player_movements
CREATE POLICY "Admins can manage player movements" ON public.player_movements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'beheerder'
    )
  );

CREATE POLICY "Players can view their own movements" ON public.player_movements
  FOR SELECT USING (
    player_id IN (
      SELECT id FROM public.players 
      WHERE players.id = player_movements.player_id
    )
  );

-- Update the group_side column to use row_side for consistency
UPDATE public.players SET row_side = group_side WHERE group_side IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_row_position ON public.players(row_side, position);
CREATE INDEX IF NOT EXISTS idx_player_movements_player_tournament ON public.player_movements(player_id, tournament_id);
