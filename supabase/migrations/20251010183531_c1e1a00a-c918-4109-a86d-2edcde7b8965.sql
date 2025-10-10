-- Voeg database trigger toe om player_tournament_stats automatisch te herberekenen
-- wanneer player_match_stats wijzigen (insert, update, delete)

CREATE OR REPLACE FUNCTION recalculate_tournament_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
  v_round_number INTEGER;
  v_player_id UUID;
BEGIN
  -- Haal tournament en round info op
  SELECT m.tournament_id, m.round_number
  INTO v_tournament_id, v_round_number
  FROM matches m
  WHERE m.id = COALESCE(NEW.match_id, OLD.match_id);
  
  -- Bepaal welke speler
  v_player_id := COALESCE(NEW.player_id, OLD.player_id);
  
  -- Herbereken stats voor deze speler/tournament/ronde vanaf ALLE player_match_stats
  WITH match_totals AS (
    SELECT 
      pms.player_id,
      m.tournament_id,
      m.round_number,
      SUM(pms.games_won) as total_games_won,
      COUNT(pms.match_id) * 8 - SUM(pms.games_won) as total_games_lost
    FROM player_match_stats pms
    JOIN matches m ON pms.match_id = m.id
    WHERE m.tournament_id = v_tournament_id
      AND m.round_number = v_round_number
      AND pms.player_id = v_player_id
    GROUP BY pms.player_id, m.tournament_id, m.round_number
  )
  INSERT INTO player_tournament_stats (player_id, tournament_id, round_number, games_won, games_lost, tiebreaker_specials_count)
  SELECT 
    player_id, 
    tournament_id, 
    round_number, 
    total_games_won, 
    total_games_lost,
    0
  FROM match_totals
  ON CONFLICT (player_id, tournament_id, round_number) 
  DO UPDATE SET 
    games_won = EXCLUDED.games_won,
    games_lost = EXCLUDED.games_lost,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Maak trigger aan
DROP TRIGGER IF EXISTS update_tournament_stats_on_match_stats ON player_match_stats;

CREATE TRIGGER update_tournament_stats_on_match_stats
AFTER INSERT OR UPDATE OR DELETE ON player_match_stats
FOR EACH ROW
EXECUTE FUNCTION recalculate_tournament_stats();

-- Data cleanup: Reset alle Round 3 tournament stats en herbereken ze correct
DELETE FROM player_tournament_stats 
WHERE round_number = 3;

-- Herbereken correct vanaf de bestaande player_match_stats
WITH match_totals AS (
  SELECT 
    pms.player_id,
    m.tournament_id,
    m.round_number,
    SUM(pms.games_won) as total_games_won,
    COUNT(pms.match_id) * 8 - SUM(pms.games_won) as total_games_lost
  FROM player_match_stats pms
  JOIN matches m ON pms.match_id = m.id
  WHERE m.round_number = 3
  GROUP BY pms.player_id, m.tournament_id, m.round_number
)
INSERT INTO player_tournament_stats (player_id, tournament_id, round_number, games_won, games_lost, tiebreaker_specials_count)
SELECT 
  player_id, 
  tournament_id, 
  round_number, 
  total_games_won, 
  total_games_lost,
  0
FROM match_totals;