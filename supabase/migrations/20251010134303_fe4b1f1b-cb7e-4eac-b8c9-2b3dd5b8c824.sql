-- Delete all existing player_tournament_stats to rebuild from scratch
DELETE FROM player_tournament_stats;

-- Rebuild player_tournament_stats from all completed matches
WITH match_player_games AS (
  SELECT 
    m.tournament_id,
    m.round_number,
    p.player_id,
    CASE 
      WHEN p.player_id IN (m.team1_player1_id, m.team1_player2_id) THEN m.team1_score
      ELSE m.team2_score
    END as games_won,
    CASE 
      WHEN p.player_id IN (m.team1_player1_id, m.team1_player2_id) THEN m.team2_score
      ELSE m.team1_score
    END as games_lost
  FROM matches m
  CROSS JOIN LATERAL (
    VALUES 
      (m.team1_player1_id),
      (m.team1_player2_id),
      (m.team2_player1_id),
      (m.team2_player2_id)
  ) AS p(player_id)
  WHERE m.status = 'completed'
    AND m.team1_score IS NOT NULL
    AND m.team2_score IS NOT NULL
)
INSERT INTO player_tournament_stats (tournament_id, player_id, round_number, games_won, games_lost)
SELECT 
  tournament_id,
  player_id,
  round_number,
  SUM(games_won) as games_won,
  SUM(games_lost) as games_lost
FROM match_player_games
GROUP BY tournament_id, player_id, round_number;
