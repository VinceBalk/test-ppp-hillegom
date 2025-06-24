
-- Add match_number column to the matches table
ALTER TABLE public.matches 
ADD COLUMN match_number integer;

-- Create a function to automatically assign match numbers for new matches
CREATE OR REPLACE FUNCTION assign_match_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign match number if it's not already set
  IF NEW.match_number IS NULL THEN
    -- Get the highest match number for this tournament and round
    SELECT COALESCE(MAX(match_number), 0) + 1
    INTO NEW.match_number
    FROM public.matches
    WHERE tournament_id = NEW.tournament_id 
    AND round_number = NEW.round_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign match numbers
CREATE TRIGGER trigger_assign_match_number
  BEFORE INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION assign_match_number();

-- Update existing matches to have sequential match numbers
-- This will assign numbers starting from 1 for each tournament/round combination
WITH numbered_matches AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tournament_id, round_number 
      ORDER BY created_at ASC
    ) as new_match_number
  FROM public.matches
  WHERE match_number IS NULL
)
UPDATE public.matches 
SET match_number = numbered_matches.new_match_number
FROM numbered_matches
WHERE matches.id = numbered_matches.id;

-- Create a function to update match numbers for a specific tournament/round
CREATE OR REPLACE FUNCTION update_match_numbers(
  p_tournament_id uuid,
  p_round_number integer,
  p_match_ids uuid[],
  p_match_numbers integer[]
)
RETURNS void AS $$
DECLARE
  i integer;
BEGIN
  -- Update each match with its new number
  FOR i IN 1..array_length(p_match_ids, 1) LOOP
    UPDATE public.matches
    SET match_number = p_match_numbers[i],
        updated_at = NOW()
    WHERE id = p_match_ids[i]
    AND tournament_id = p_tournament_id
    AND round_number = p_round_number;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
