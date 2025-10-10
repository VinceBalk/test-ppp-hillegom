-- Corrigeer row_side voor spelers Jip Poos en Vidar
UPDATE public.players
SET row_side = 'right'
WHERE name IN ('Jip Poos', 'Vidar');