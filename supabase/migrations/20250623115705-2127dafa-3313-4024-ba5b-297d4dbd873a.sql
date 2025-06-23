
-- Add menu_order column to courts table for ordering
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0;

-- Update existing courts to have menu_order based on their name
-- First, handle courts with numbers in their names
UPDATE public.courts 
SET menu_order = 
  CASE 
    WHEN name ILIKE '%1%' THEN 1
    WHEN name ILIKE '%2%' THEN 2
    WHEN name ILIKE '%3%' THEN 3
    WHEN name ILIKE '%4%' THEN 4
    WHEN name ILIKE '%5%' THEN 5
    WHEN name ILIKE '%6%' THEN 6
    ELSE 999
  END
WHERE menu_order = 0;

-- For courts without numbers, set them to start from 100 to keep them after numbered courts
-- We'll use a counter approach instead of ROW_NUMBER()
DO $$
DECLARE
  court_record RECORD;
  counter INTEGER := 100;
BEGIN
  FOR court_record IN 
    SELECT id FROM public.courts 
    WHERE menu_order = 999 
    ORDER BY name
  LOOP
    UPDATE public.courts 
    SET menu_order = counter 
    WHERE id = court_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Create index for better performance when ordering by menu_order
CREATE INDEX IF NOT EXISTS idx_courts_menu_order ON public.courts(menu_order);
