
-- Update players table to change skill_level to group_side
ALTER TABLE public.players 
DROP CONSTRAINT IF EXISTS players_skill_level_check;

ALTER TABLE public.players 
ALTER COLUMN skill_level TYPE TEXT;

UPDATE public.players 
SET skill_level = 'left' 
WHERE skill_level IN ('beginner', 'intermediate', 'advanced');

ALTER TABLE public.players 
RENAME COLUMN skill_level TO group_side;

ALTER TABLE public.players 
ADD CONSTRAINT players_group_side_check 
CHECK (group_side IN ('left', 'right'));

ALTER TABLE public.players 
ALTER COLUMN group_side SET DEFAULT 'left';

-- Add ranking_score column for future ranking calculations
ALTER TABLE public.players 
ADD COLUMN ranking_score INTEGER DEFAULT 0;

-- Remove tournament_type from tournaments table
ALTER TABLE public.tournaments 
DROP COLUMN tournament_type;
