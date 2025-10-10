-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_tournament_specials_ranking(uuid, integer);

-- Recreate with tie-breaker logic
CREATE OR REPLACE FUNCTION public.get_tournament_specials_ranking(
  p_tournament_id uuid, 
  p_round_number integer DEFAULT NULL
)
RETURNS TABLE(
  player_id uuid, 
  player_name text, 
  total_specials integer, 
  rank_position integer, 
  title text
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH player_specials AS (
    SELECT 
      ms.player_id,
      p.name as player_name,
      SUM(ms.count) as total_specials,
      MIN(m.round_number) as earliest_round
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN players p ON ms.player_id = p.id
    WHERE m.tournament_id = p_tournament_id
      AND (p_round_number IS NULL OR m.round_number <= p_round_number)
    GROUP BY ms.player_id, p.name
  ),
  player_specials_with_earliest_count AS (
    SELECT 
      ps.player_id,
      ps.player_name,
      ps.total_specials,
      ps.earliest_round,
      COALESCE((
        SELECT SUM(ms2.count)
        FROM match_specials ms2
        JOIN matches m2 ON ms2.match_id = m2.id
        WHERE ms2.player_id = ps.player_id
          AND m2.tournament_id = p_tournament_id
          AND m2.round_number = ps.earliest_round
          AND (p_round_number IS NULL OR m2.round_number <= p_round_number)
      ), 0) as specials_in_earliest_round
    FROM player_specials ps
  ),
  ranked_players AS (
    SELECT 
      player_id,
      player_name,
      total_specials,
      ROW_NUMBER() OVER (
        ORDER BY 
          total_specials DESC, 
          earliest_round ASC, 
          specials_in_earliest_round DESC
      ) as rank_position
    FROM player_specials_with_earliest_count
  )
  SELECT 
    rp.player_id,
    rp.player_name,
    rp.total_specials::INTEGER,
    rp.rank_position::INTEGER,
    CASE 
      WHEN rp.rank_position = 1 THEN 'Chef Special'
      WHEN rp.rank_position = 2 THEN 'Sous Chef'
      ELSE NULL
    END as title
  FROM ranked_players rp
  ORDER BY rp.rank_position;
$function$;