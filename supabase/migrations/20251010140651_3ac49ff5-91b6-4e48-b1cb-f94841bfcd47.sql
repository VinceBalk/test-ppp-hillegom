-- Functie om player tournament stats te updaten inclusief specials
CREATE OR REPLACE FUNCTION public.update_player_tournament_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats voor alle spelers in de match
  WITH match_players AS (
    SELECT 
      NEW.tournament_id,
      NEW.round_number,
      UNNEST(ARRAY[NEW.team1_player1_id, NEW.team1_player2_id]) as player_id,
      CASE 
        WHEN NEW.team1_score > NEW.team2_score THEN NEW.team1_score
        ELSE NEW.team2_score
      END as games_won,
      CASE 
        WHEN NEW.team1_score > NEW.team2_score THEN NEW.team2_score
        ELSE NEW.team1_score
      END as games_lost
    UNION ALL
    SELECT 
      NEW.tournament_id,
      NEW.round_number,
      UNNEST(ARRAY[NEW.team2_player1_id, NEW.team2_player2_id]) as player_id,
      CASE 
        WHEN NEW.team2_score > NEW.team1_score THEN NEW.team2_score
        ELSE NEW.team1_score
      END as games_won,
      CASE 
        WHEN NEW.team2_score > NEW.team1_score THEN NEW.team1_score
        ELSE NEW.team2_score
      END as games_lost
  ),
  player_specials AS (
    SELECT 
      ms.player_id,
      NEW.tournament_id,
      NEW.round_number,
      COALESCE(SUM(ms.count), 0) as total_specials
    FROM public.match_specials ms
    JOIN public.matches m ON ms.match_id = m.id
    WHERE m.tournament_id = NEW.tournament_id 
      AND m.round_number = NEW.round_number
      AND ms.player_id IN (
        NEW.team1_player1_id, 
        NEW.team1_player2_id, 
        NEW.team2_player1_id, 
        NEW.team2_player2_id
      )
    GROUP BY ms.player_id, NEW.tournament_id, NEW.round_number
  )
  INSERT INTO public.player_tournament_stats (
    player_id, 
    tournament_id, 
    round_number, 
    games_won, 
    games_lost,
    tiebreaker_specials_count
  )
  SELECT 
    mp.player_id,
    mp.tournament_id,
    mp.round_number,
    mp.games_won,
    mp.games_lost,
    COALESCE(ps.total_specials, 0)
  FROM match_players mp
  LEFT JOIN player_specials ps ON ps.player_id = mp.player_id
  WHERE mp.player_id IS NOT NULL
  ON CONFLICT (player_id, tournament_id, round_number) 
  DO UPDATE SET
    games_won = EXCLUDED.games_won,
    games_lost = EXCLUDED.games_lost,
    tiebreaker_specials_count = EXCLUDED.tiebreaker_specials_count,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger voor het updaten van stats bij match updates
DROP TRIGGER IF EXISTS update_player_stats_on_match_change ON public.matches;
CREATE TRIGGER update_player_stats_on_match_change
AFTER INSERT OR UPDATE OF team1_score, team2_score ON public.matches
FOR EACH ROW
WHEN (NEW.team1_score IS NOT NULL OR NEW.team2_score IS NOT NULL)
EXECUTE FUNCTION public.update_player_tournament_stats();

-- Functie om specials te updaten wanneer match_specials worden gewijzigd
CREATE OR REPLACE FUNCTION public.update_specials_in_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
  v_round_number INTEGER;
BEGIN
  -- Haal tournament en round info op van de match
  SELECT m.tournament_id, m.round_number
  INTO v_tournament_id, v_round_number
  FROM public.matches m
  WHERE m.id = COALESCE(NEW.match_id, OLD.match_id);

  -- Update de specials count voor de betreffende speler
  IF TG_OP = 'DELETE' THEN
    UPDATE public.player_tournament_stats
    SET tiebreaker_specials_count = (
      SELECT COALESCE(SUM(ms.count), 0)
      FROM public.match_specials ms
      JOIN public.matches m ON ms.match_id = m.id
      WHERE m.tournament_id = v_tournament_id
        AND m.round_number = v_round_number
        AND ms.player_id = OLD.player_id
    ),
    updated_at = NOW()
    WHERE player_id = OLD.player_id
      AND tournament_id = v_tournament_id
      AND round_number = v_round_number;
  ELSE
    UPDATE public.player_tournament_stats
    SET tiebreaker_specials_count = (
      SELECT COALESCE(SUM(ms.count), 0)
      FROM public.match_specials ms
      JOIN public.matches m ON ms.match_id = m.id
      WHERE m.tournament_id = v_tournament_id
        AND m.round_number = v_round_number
        AND ms.player_id = NEW.player_id
    ),
    updated_at = NOW()
    WHERE player_id = NEW.player_id
      AND tournament_id = v_tournament_id
      AND round_number = v_round_number;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger voor match_specials wijzigingen
DROP TRIGGER IF EXISTS update_stats_on_specials_change ON public.match_specials;
CREATE TRIGGER update_stats_on_specials_change
AFTER INSERT OR UPDATE OR DELETE ON public.match_specials
FOR EACH ROW
EXECUTE FUNCTION public.update_specials_in_stats();

-- Recalculeer alle bestaande stats om specials correct bij te werken
WITH match_data AS (
  SELECT 
    m.id as match_id,
    m.tournament_id,
    m.round_number,
    m.team1_player1_id,
    m.team1_player2_id,
    m.team2_player1_id,
    m.team2_player2_id,
    m.team1_score,
    m.team2_score
  FROM public.matches m
  WHERE m.team1_score IS NOT NULL OR m.team2_score IS NOT NULL
),
all_match_players AS (
  SELECT 
    tournament_id,
    round_number,
    UNNEST(ARRAY[team1_player1_id, team1_player2_id]) as player_id,
    CASE 
      WHEN team1_score > team2_score THEN team1_score
      ELSE team2_score
    END as games_won,
    CASE 
      WHEN team1_score > team2_score THEN team2_score
      ELSE team1_score
    END as games_lost
  FROM match_data
  UNION ALL
  SELECT 
    tournament_id,
    round_number,
    UNNEST(ARRAY[team2_player1_id, team2_player2_id]) as player_id,
    CASE 
      WHEN team2_score > team1_score THEN team2_score
      ELSE team1_score
    END as games_won,
    CASE 
      WHEN team2_score > team1_score THEN team1_score
      ELSE team2_score
    END as games_lost
  FROM match_data
),
aggregated_stats AS (
  SELECT 
    player_id,
    tournament_id,
    round_number,
    SUM(games_won) as total_games_won,
    SUM(games_lost) as total_games_lost
  FROM all_match_players
  WHERE player_id IS NOT NULL
  GROUP BY player_id, tournament_id, round_number
),
specials_per_player AS (
  SELECT 
    ms.player_id,
    m.tournament_id,
    m.round_number,
    COALESCE(SUM(ms.count), 0) as total_specials
  FROM public.match_specials ms
  JOIN public.matches m ON ms.match_id = m.id
  GROUP BY ms.player_id, m.tournament_id, m.round_number
)
INSERT INTO public.player_tournament_stats (
  player_id,
  tournament_id,
  round_number,
  games_won,
  games_lost,
  tiebreaker_specials_count
)
SELECT 
  a.player_id,
  a.tournament_id,
  a.round_number,
  a.total_games_won,
  a.total_games_lost,
  COALESCE(s.total_specials, 0)
FROM aggregated_stats a
LEFT JOIN specials_per_player s ON 
  s.player_id = a.player_id AND
  s.tournament_id = a.tournament_id AND
  s.round_number = a.round_number
ON CONFLICT (player_id, tournament_id, round_number)
DO UPDATE SET
  games_won = EXCLUDED.games_won,
  games_lost = EXCLUDED.games_lost,
  tiebreaker_specials_count = EXCLUDED.tiebreaker_specials_count,
  updated_at = NOW();