
-- Voeg een kolom toe aan tournaments om bij te houden welke rondes al gegenereerd zijn
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS round_1_schedule_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round_2_schedule_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round_3_schedule_generated BOOLEAN DEFAULT FALSE;

-- Voeg een tabel toe voor opgeslagen schemas
CREATE TABLE IF NOT EXISTS tournament_schedule_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) NOT NULL,
  round_number INTEGER NOT NULL,
  preview_data JSONB NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, round_number)
);

-- RLS policies voor tournament_schedule_previews
ALTER TABLE tournament_schedule_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tournament schedule previews" 
  ON tournament_schedule_previews 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create tournament schedule previews" 
  ON tournament_schedule_previews 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update tournament schedule previews" 
  ON tournament_schedule_previews 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete tournament schedule previews" 
  ON tournament_schedule_previews 
  FOR DELETE 
  USING (true);

-- Update de bestaande tournaments waar al matches zijn gegenereerd
UPDATE tournaments 
SET round_1_schedule_generated = TRUE 
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM matches 
  WHERE round_number = 1
);

UPDATE tournaments 
SET round_2_schedule_generated = TRUE 
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM matches 
  WHERE round_number = 2
);

UPDATE tournaments 
SET round_3_schedule_generated = TRUE 
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM matches 
  WHERE round_number = 3
);
