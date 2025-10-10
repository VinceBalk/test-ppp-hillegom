
-- Backfill player_tournament_stats voor alle completed matches
INSERT INTO player_tournament_stats (tournament_id, player_id, round_number, games_won, games_lost)
SELECT 
  m.tournament_id,
  pms.player_id,
  m.round_number,
  SUM(pms.games_won) as games_won,
  SUM(CASE 
    WHEN pms.team_number = 1 THEN m.team2_score
    WHEN pms.team_number = 2 THEN m.team1_score
  END) as games_lost
FROM player_match_stats pms
JOIN matches m ON pms.match_id = m.id
WHERE m.status = 'completed'
  AND m.team1_score IS NOT NULL
  AND m.team2_score IS NOT NULL
GROUP BY m.tournament_id, pms.player_id, m.round_number
ON CONFLICT (tournament_id, player_id, round_number) 
DO UPDATE SET
  games_won = player_tournament_stats.games_won + EXCLUDED.games_won,
  games_lost = player_tournament_stats.games_lost + EXCLUDED.games_lost;
