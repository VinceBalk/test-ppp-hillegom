-- Drop and recreate function with updated return type
DROP FUNCTION IF EXISTS public.get_player_specials_by_year(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_player_specials_by_year(p_player_id uuid, p_year integer)
RETURNS TABLE(
  total_specials integer,
  tournaments_count integer,
  chef_special_titles integer,
  sous_chef_titles integer,
  year_rank integer
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH tournament_rankings AS (
    SELECT 
      m.tournament_id,
      ms.player_id,
      SUM(ms.count) as specials,
      ROW_NUMBER() OVER (PARTITION BY m.tournament_id ORDER BY SUM(ms.count) DESC) as rank
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN tournaments t ON m.tournament_id = t.id
    WHERE EXTRACT(YEAR FROM t.start_date) = p_year
    GROUP BY m.tournament_id, ms.player_id
  ),
  player_tournaments AS (
    SELECT 
      tournament_id,
      specials,
      rank
    FROM tournament_rankings
    WHERE player_id = p_player_id
  ),
  year_totals AS (
    SELECT 
      ms.player_id,
      SUM(ms.count) as total_specials
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN tournaments t ON m.tournament_id = t.id
    WHERE EXTRACT(YEAR FROM t.start_date) = p_year
    GROUP BY ms.player_id
  ),
  year_rank AS (
    SELECT 
      player_id,
      ROW_NUMBER() OVER (ORDER BY total_specials DESC) as rank
    FROM year_totals
  )
  SELECT 
    COALESCE((SELECT SUM(specials) FROM player_tournaments), 0)::INTEGER as total_specials,
    COALESCE((SELECT COUNT(DISTINCT tournament_id) FROM player_tournaments), 0)::INTEGER as tournaments_count,
    COALESCE((SELECT COUNT(*) FROM player_tournaments WHERE rank = 1), 0)::INTEGER as chef_special_titles,
    COALESCE((SELECT COUNT(*) FROM player_tournaments WHERE rank = 2), 0)::INTEGER as sous_chef_titles,
    COALESCE((SELECT rank FROM year_rank WHERE player_id = p_player_id), 999)::INTEGER as year_rank;
$function$;