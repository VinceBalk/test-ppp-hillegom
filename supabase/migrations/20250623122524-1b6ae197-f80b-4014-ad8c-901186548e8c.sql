
-- Add row_side column to courts table for left/right grouping
ALTER TABLE public.courts 
ADD COLUMN IF NOT EXISTS row_side TEXT CHECK (row_side IN ('left', 'right')) DEFAULT 'left';

-- Update existing courts based on their menu_order
-- Odd menu_order = left, even menu_order = right
UPDATE public.courts 
SET row_side = CASE 
  WHEN menu_order % 2 = 1 THEN 'left'
  ELSE 'right'
END;

-- Make row_side required for new records
ALTER TABLE public.courts 
ALTER COLUMN row_side SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_courts_row_side ON public.courts(row_side, menu_order);
