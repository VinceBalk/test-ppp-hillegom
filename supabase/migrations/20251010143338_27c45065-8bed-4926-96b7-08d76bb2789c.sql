-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_player_stats_on_match_change ON public.matches;
DROP FUNCTION IF EXISTS public.update_player_tournament_stats();

-- Create corrected function that gives team scores to all team members
CREATE OR REPLACE FUNCTION public.update_player_tournament_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing stats for this match's players in this round
  DELETE FROM public.player_tournament_stats
  WHERE tournament_id = NEW.tournament_id 
    AND round_number = NEW.round_number
    AND player_id IN (
      NEW.team1_player1_id, 
      NEW.team1_player2_id, 
      NEW.team2_player1_id, 
      NEW.team2_player2_id
    );

  -- Insert stats for team 1 players (both get same team score)
  INSERT INTO public.player_tournament_stats (
    player_id, 
    tournament_id, 
    round_number, 
    games_won, 
    games_lost,
    tiebreaker_specials_count
  )
  SELECT 
    player_id,
    NEW.tournament_id,
    NEW.round_number,
    COALESCE(NEW.team1_score, 0) as games_won,
    COALESCE(NEW.team2_score, 0) as games_lost,
    COALESCE((
      SELECT SUM(ms.count) 
      FROM public.match_specials ms
      JOIN public.matches m ON ms.match_id = m.id
      WHERE m.tournament_id = NEW.tournament_id
        AND m.round_number = NEW.round_number
        AND ms.player_id = player_id
    ), 0) as tiebreaker_specials_count
  FROM (
    SELECT NEW.team1_player1_id as player_id
    UNION ALL
    SELECT NEW.team1_player2_id
  ) team1_players
  WHERE player_id IS NOT NULL;

  -- Insert stats for team 2 players (both get same team score)
  INSERT INTO public.player_tournament_stats (
    player_id, 
    tournament_id, 
    round_number, 
    games_won, 
    games_lost,
    tiebreaker_specials_count
  )
  SELECT 
    player_id,
    NEW.tournament_id,
    NEW.round_number,
    COALESCE(NEW.team2_score, 0) as games_won,
    COALESCE(NEW.team1_score, 0) as games_lost,
    COALESCE((
      SELECT SUM(ms.count) 
      FROM public.match_specials ms
      JOIN public.matches m ON ms.match_id = m.id
      WHERE m.tournament_id = NEW.tournament_id
        AND m.round_number = NEW.round_number
        AND ms.player_id = player_id
    ), 0) as tiebreaker_specials_count
  FROM (
    SELECT NEW.team2_player1_id as player_id
    UNION ALL
    SELECT NEW.team2_player2_id
  ) team2_players
  WHERE player_id IS NOT NULL;

  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER update_player_stats_on_match_change
AFTER INSERT OR UPDATE OF team1_score, team2_score, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id
ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_player_tournament_stats();

-- Recalculate all existing stats
TRUNCATE TABLE public.player_tournament_stats;

-- Recalculate stats from all matches
INSERT INTO public.player_tournament_stats (
  player_id, 
  tournament_id, 
  round_number, 
  games_won, 
  games_lost,
  tiebreaker_specials_count
)
SELECT 
  player_id,
  tournament_id,
  round_number,
  SUM(games_won) as games_won,
  SUM(games_lost) as games_lost,
  COALESCE((
    SELECT SUM(ms.count) 
    FROM public.match_specials ms
    JOIN public.matches m ON ms.match_id = m.id
    WHERE m.tournament_id = stats.tournament_id
      AND m.round_number = stats.round_number
      AND ms.player_id = stats.player_id
  ), 0) as tiebreaker_specials_count
FROM (
  -- Team 1 players get team1_score as won, team2_score as lost
  SELECT 
    m.tournament_id,
    m.round_number,
    m.team1_player1_id as player_id,
    m.team1_score as games_won,
    m.team2_score as games_lost
  FROM public.matches m
  WHERE m.team1_player1_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    m.tournament_id,
    m.round_number,
    m.team1_player2_id as player_id,
    m.team1_score as games_won,
    m.team2_score as games_lost
  FROM public.matches m
  WHERE m.team1_player2_id IS NOT NULL
  
  UNION ALL
  
  -- Team 2 players get team2_score as won, team1_score as lost
  SELECT 
    m.tournament_id,
    m.round_number,
    m.team2_player1_id as player_id,
    m.team2_score as games_won,
    m.team1_score as games_lost
  FROM public.matches m
  WHERE m.team2_player1_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    m.tournament_id,
    m.round_number,
    m.team2_player2_id as player_id,
    m.team2_score as games_won,
    m.team1_score as games_lost
  FROM public.matches m
  WHERE m.team2_player2_id IS NOT NULL
) stats
GROUP BY player_id, tournament_id, round_number;