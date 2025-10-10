-- Update the get_tournament_specials_ranking function to support filtering by round
DROP FUNCTION IF EXISTS public.get_tournament_specials_ranking(uuid);

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
      SUM(ms.count) as total_specials
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN players p ON ms.player_id = p.id
    WHERE m.tournament_id = p_tournament_id
      AND (p_round_number IS NULL OR m.round_number = p_round_number)
    GROUP BY ms.player_id, p.name
  ),
  ranked_players AS (
    SELECT 
      player_id,
      player_name,
      total_specials,
      ROW_NUMBER() OVER (ORDER BY total_specials DESC) as rank_position
    FROM player_specials
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