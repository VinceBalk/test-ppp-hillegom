
-- Delete all matches for the specific tournament
DELETE FROM public.matches 
WHERE tournament_id = '2f48bdaf-62ae-40ec-b79a-45b3c6d7c378';

-- Reset the tournament's round generation flags and status
UPDATE public.tournaments 
SET 
  round_1_generated = false,
  round_2_generated = false,
  round_3_generated = false,
  current_round = 1,
  status = 'open'
WHERE id = '2f48bdaf-62ae-40ec-b79a-45b3c6d7c378';

-- Delete any tournament rounds for this tournament (if they exist)
DELETE FROM public.tournament_rounds 
WHERE tournament_id = '2f48bdaf-62ae-40ec-b79a-45b3c6d7c378';
