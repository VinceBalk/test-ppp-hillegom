
-- Delete all existing matches from the matches table
DELETE FROM public.matches;

-- Reset the round generation flags for all tournaments so you can regenerate schedules
UPDATE public.tournaments 
SET 
  round_1_generated = false,
  round_2_generated = false,
  round_3_generated = false,
  current_round = 1,
  status = 'open'
WHERE status = 'in_progress';
