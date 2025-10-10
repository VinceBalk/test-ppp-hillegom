-- Function to calculate player specials ranking for a tournament
CREATE OR REPLACE FUNCTION public.get_tournament_specials_ranking(p_tournament_id uuid)
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
AS $$
  WITH player_specials AS (
    SELECT 
      ms.player_id,
      p.name as player_name,
      SUM(ms.count) as total_specials
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN players p ON ms.player_id = p.id
    WHERE m.tournament_id = p_tournament_id
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
$$;

-- Function to get player specials for a specific year (season)
CREATE OR REPLACE FUNCTION public.get_player_specials_by_year(p_player_id uuid, p_year integer)
RETURNS TABLE(
  total_specials integer,
  tournaments_count integer,
  chef_special_titles integer,
  sous_chef_titles integer
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH tournament_rankings AS (
    SELECT 
      m.tournament_id,
      SUM(ms.count) as specials,
      ROW_NUMBER() OVER (PARTITION BY m.tournament_id ORDER BY SUM(ms.count) DESC) as rank
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    JOIN tournaments t ON m.tournament_id = t.id
    WHERE ms.player_id = p_player_id
      AND EXTRACT(YEAR FROM t.start_date) = p_year
    GROUP BY m.tournament_id
  )
  SELECT 
    COALESCE(SUM(specials), 0)::INTEGER as total_specials,
    COUNT(DISTINCT tournament_id)::INTEGER as tournaments_count,
    COUNT(CASE WHEN rank = 1 THEN 1 END)::INTEGER as chef_special_titles,
    COUNT(CASE WHEN rank = 2 THEN 1 END)::INTEGER as sous_chef_titles
  FROM tournament_rankings;
$$;