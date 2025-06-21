
-- Verwijder alle wedstrijden die mogelijk incorrect zijn aangemaakt
DELETE FROM public.matches 
WHERE created_at > NOW() - INTERVAL '1 day';

-- Reset tournament status indien nodig
UPDATE public.tournaments 
SET 
  round_1_generated = false,
  round_2_generated = false, 
  round_3_generated = false,
  status = 'open'
WHERE status = 'in_progress' AND created_at > NOW() - INTERVAL '1 day';

-- Controleer en herstel eventuele data inconsistenties
-- Zorg ervoor dat alle tournament_players een geldige groep hebben
UPDATE public.tournament_players 
SET "group" = 'left' 
WHERE "group" IS NULL OR "group" = '';

-- Voeg een functie toe om matches op te slaan per individuele wedstrijd
CREATE OR REPLACE FUNCTION public.save_individual_match(
  p_match_id uuid,
  p_team1_player1_id uuid,
  p_team1_player2_id uuid,
  p_team2_player1_id uuid,
  p_team2_player2_id uuid,
  p_court_id uuid DEFAULT NULL,
  p_court_number text DEFAULT NULL,
  p_round_within_group integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_match json;
BEGIN
  -- Update de wedstrijd met nieuwe gegevens
  UPDATE public.matches
  SET 
    team1_player1_id = p_team1_player1_id,
    team1_player2_id = p_team1_player2_id,
    team2_player1_id = p_team2_player1_id,
    team2_player2_id = p_team2_player2_id,
    court_id = p_court_id,
    court_number = p_court_number,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Haal de bijgewerkte wedstrijd op met alle gerelateerde data
  SELECT row_to_json(match_data) INTO result_match
  FROM (
    SELECT 
      m.*,
      t.name as tournament_name,
      tp1.name as team1_player1_name,
      tp2.name as team1_player2_name,
      tp3.name as team2_player1_name,
      tp4.name as team2_player2_name,
      c.name as court_name
    FROM public.matches m
    LEFT JOIN public.tournaments t ON m.tournament_id = t.id
    LEFT JOIN public.players tp1 ON m.team1_player1_id = tp1.id
    LEFT JOIN public.players tp2 ON m.team1_player2_id = tp2.id
    LEFT JOIN public.players tp3 ON m.team2_player1_id = tp3.id
    LEFT JOIN public.players tp4 ON m.team2_player2_id = tp4.id
    LEFT JOIN public.courts c ON m.court_id = c.id
    WHERE m.id = p_match_id
  ) match_data;

  RETURN result_match;
END;
$$;
