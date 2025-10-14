
-- Fix round_1_schedule_generated flag for tournament 1962f640-87a5-415a-9749-39f74a74230c
-- This tournament has completed round 1 matches but the flag was never set

UPDATE tournaments 
SET 
  round_1_schedule_generated = true,
  updated_at = NOW()
WHERE id = '1962f640-87a5-415a-9749-39f74a74230c'
  AND round_1_schedule_generated = false;
