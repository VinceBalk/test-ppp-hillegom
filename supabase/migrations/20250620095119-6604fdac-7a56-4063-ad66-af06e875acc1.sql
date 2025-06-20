
-- Add group and active columns to tournament_players table
ALTER TABLE public.tournament_players 
ADD COLUMN IF NOT EXISTS "group" TEXT CHECK ("group" IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update existing records to have default values
UPDATE public.tournament_players 
SET "group" = 'left', active = true 
WHERE "group" IS NULL OR active IS NULL;

-- Make group column required for new records
ALTER TABLE public.tournament_players 
ALTER COLUMN "group" SET NOT NULL;

-- Add RLS policies for tournament_players table
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- Allow users to view all tournament players (for tournament management)
CREATE POLICY "Anyone can view tournament players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert tournament players
CREATE POLICY "Authenticated users can add tournament players" 
  ON public.tournament_players 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tournament players
CREATE POLICY "Authenticated users can update tournament players" 
  ON public.tournament_players 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow authenticated users to delete tournament players
CREATE POLICY "Authenticated users can delete tournament players" 
  ON public.tournament_players 
  FOR DELETE 
  TO authenticated
  USING (true);
