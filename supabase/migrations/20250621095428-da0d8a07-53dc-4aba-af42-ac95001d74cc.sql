
-- Courts table for court management
CREATE TABLE public.courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  background_color TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Extend tournaments table for round management
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 3;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_1_generated BOOLEAN DEFAULT false;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_2_generated BOOLEAN DEFAULT false;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS round_3_generated BOOLEAN DEFAULT false;

-- Tournament rounds table to track round-specific data
CREATE TABLE public.tournament_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  is_manually_adjusted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, round_number)
);

-- Extend matches table for court assignment and round tracking
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS court_id UUID REFERENCES public.courts(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team1_player1_id UUID REFERENCES public.players(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team1_player2_id UUID REFERENCES public.players(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team2_player1_id UUID REFERENCES public.players(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team2_player2_id UUID REFERENCES public.players(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team1_score INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team2_score INTEGER DEFAULT 0;

-- Create specials management table
CREATE TABLE public.special_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_tiebreaker BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default special types
INSERT INTO public.special_types (name, is_tiebreaker) VALUES
('Ace', true),
('Via zijwand', true),
('Uit de kooi', true),
('Dubbele fout', false),
('Love game gewonnen', true),
('Love game verloren', false);

-- Match specials tracking
CREATE TABLE public.match_specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  special_type_id UUID REFERENCES public.special_types(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id, special_type_id)
);

-- Player tournament stats per round
CREATE TABLE public.player_tournament_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  tiebreaker_specials_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id, round_number)
);

-- Enable RLS on new tables
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tournament_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courts
CREATE POLICY "Organisators and beheerders can manage courts" 
  ON public.courts 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view active courts" 
  ON public.courts 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') AND is_active = true);

-- RLS Policies for tournament_rounds
CREATE POLICY "Organisators and beheerders can manage tournament rounds" 
  ON public.tournament_rounds 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view tournament rounds" 
  ON public.tournament_rounds 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- RLS Policies for special_types
CREATE POLICY "Organisators and beheerders can manage special types" 
  ON public.special_types 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view active special types" 
  ON public.special_types 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler') AND is_active = true);

-- RLS Policies for match_specials
CREATE POLICY "Organisators and beheerders can manage match specials" 
  ON public.match_specials 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view match specials" 
  ON public.match_specials 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- RLS Policies for player_tournament_stats  
CREATE POLICY "Organisators and beheerders can manage player tournament stats" 
  ON public.player_tournament_stats 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view player tournament stats" 
  ON public.player_tournament_stats 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- Function to calculate player ranking within tournament
CREATE OR REPLACE FUNCTION public.calculate_player_tournament_ranking(p_tournament_id UUID, p_player_id UUID)
RETURNS TABLE(total_games_won INTEGER, total_tiebreaker_specials INTEGER, ranking_position INTEGER)
LANGUAGE sql
STABLE
AS $$
  WITH player_totals AS (
    SELECT 
      player_id,
      SUM(games_won) as total_games,
      SUM(tiebreaker_specials_count) as total_specials
    FROM public.player_tournament_stats 
    WHERE tournament_id = p_tournament_id
    GROUP BY player_id
  ),
  ranked_players AS (
    SELECT 
      player_id,
      total_games,
      total_specials,
      ROW_NUMBER() OVER (ORDER BY total_games DESC, total_specials DESC) as rank
    FROM player_totals
  )
  SELECT 
    COALESCE(rp.total_games, 0)::INTEGER,
    COALESCE(rp.total_specials, 0)::INTEGER,
    COALESCE(rp.rank, 999)::INTEGER
  FROM ranked_players rp
  WHERE rp.player_id = p_player_id;
$$;
