-- Add total_specials column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS total_specials integer DEFAULT 0;

-- Create trigger function to automatically update player overall stats
CREATE OR REPLACE FUNCTION update_player_overall_stats()
RETURNS trigger AS $$
BEGIN
  -- Update totals for affected player
  UPDATE players p
  SET 
    total_games_won = (
      SELECT COALESCE(SUM(games_won), 0)
      FROM player_tournament_stats
      WHERE player_id = p.id
    ),
    total_tournaments = (
      SELECT COUNT(DISTINCT tournament_id)
      FROM player_tournament_stats
      WHERE player_id = p.id
    ),
    total_specials = (
      SELECT COALESCE(SUM(tiebreaker_specials_count), 0)
      FROM player_tournament_stats
      WHERE player_id = p.id
    ),
    avg_games_per_tournament = (
      SELECT CASE 
        WHEN COUNT(DISTINCT tournament_id) > 0 
        THEN COALESCE(SUM(games_won), 0)::numeric / COUNT(DISTINCT tournament_id)
        ELSE 0 
      END
      FROM player_tournament_stats
      WHERE player_id = p.id
    )
  WHERE p.id = COALESCE(NEW.player_id, OLD.player_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on player_tournament_stats
DROP TRIGGER IF EXISTS trigger_update_player_stats ON player_tournament_stats;
CREATE TRIGGER trigger_update_player_stats
AFTER INSERT OR UPDATE OR DELETE ON player_tournament_stats
FOR EACH ROW EXECUTE FUNCTION update_player_overall_stats();

-- One-time data migration to populate existing stats
UPDATE players p
SET 
  total_games_won = (
    SELECT COALESCE(SUM(games_won), 0)
    FROM player_tournament_stats
    WHERE player_id = p.id
  ),
  total_tournaments = (
    SELECT COUNT(DISTINCT tournament_id)
    FROM player_tournament_stats
    WHERE player_id = p.id
  ),
  total_specials = (
    SELECT COALESCE(SUM(tiebreaker_specials_count), 0)
    FROM player_tournament_stats
    WHERE player_id = p.id
  ),
  avg_games_per_tournament = (
    SELECT CASE 
      WHEN COUNT(DISTINCT tournament_id) > 0 
      THEN COALESCE(SUM(games_won), 0)::numeric / COUNT(DISTINCT tournament_id)
      ELSE 0 
    END
    FROM player_tournament_stats
    WHERE player_id = p.id
  );