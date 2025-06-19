
-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_players INTEGER DEFAULT 16,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  tournament_type TEXT DEFAULT 'single_elimination' CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES public.players(id),
  player2_id UUID REFERENCES public.players(id),
  winner_id UUID REFERENCES public.players(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  match_date TIMESTAMP WITH TIME ZONE,
  court_number TEXT,
  round_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_players junction table
CREATE TABLE public.tournament_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Organisators and beheerders can manage players" 
  ON public.players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view players" 
  ON public.players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- RLS Policies for tournaments
CREATE POLICY "Organisators and beheerders can manage tournaments" 
  ON public.tournaments 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- RLS Policies for matches
CREATE POLICY "Organisators and beheerders can manage matches" 
  ON public.matches 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view matches" 
  ON public.matches 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));

-- RLS Policies for tournament_players
CREATE POLICY "Organisators and beheerders can manage tournament players" 
  ON public.tournament_players 
  FOR ALL 
  USING (public.has_role_or_higher(auth.uid(), 'organisator'));

CREATE POLICY "Spelers can view tournament players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (public.has_role_or_higher(auth.uid(), 'speler'));
