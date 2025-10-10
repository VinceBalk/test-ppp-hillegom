
-- Fix: Herbereken alle tiebreaker_specials_count voor Summer 2025 tournament
-- Tournament ID: 2f48bdaf-62ae-40ec-b79a-45b3c6d7c378

DO $$
DECLARE
  v_tournament_id UUID := '2f48bdaf-62ae-40ec-b79a-45b3c6d7c378';
  v_player_record RECORD;
  v_round_number INTEGER;
  v_total_specials INTEGER;
BEGIN
  -- Loop door alle spelers in player_tournament_stats voor dit toernooi
  FOR v_player_record IN 
    SELECT DISTINCT player_id, round_number
    FROM player_tournament_stats
    WHERE tournament_id = v_tournament_id
  LOOP
    -- Haal alle match IDs op voor deze ronde
    -- Bereken totaal aantal specials voor deze speler in deze ronde
    SELECT COALESCE(SUM(ms.count), 0)
    INTO v_total_specials
    FROM match_specials ms
    JOIN matches m ON ms.match_id = m.id
    WHERE m.tournament_id = v_tournament_id
      AND m.round_number = v_player_record.round_number
      AND ms.player_id = v_player_record.player_id;
    
    -- Update de tiebreaker_specials_count
    UPDATE player_tournament_stats
    SET tiebreaker_specials_count = v_total_specials
    WHERE tournament_id = v_tournament_id
      AND player_id = v_player_record.player_id
      AND round_number = v_player_record.round_number;
    
    RAISE NOTICE 'Updated player % round % with % specials', 
      v_player_record.player_id, v_player_record.round_number, v_total_specials;
  END LOOP;
END $$;
