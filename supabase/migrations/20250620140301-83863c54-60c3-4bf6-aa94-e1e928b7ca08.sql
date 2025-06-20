
-- Add the new setting keys for the system configuration
INSERT INTO public.settings (key, value, description) VALUES
('fontFamily', '"Inter, sans-serif"', 'Font family for the application'),
('fontSize', '"16px"', 'Base font size'),
('headingColor', '"#1f2937"', 'Color for headings'),
('paragraphColor', '"#6b7280"', 'Color for paragraph text'),
('spacing', '"1rem"', 'Base spacing unit'),
('borderColor', '"#e5e7eb"', 'Default border color'),
('borderWidth', '"1px"', 'Default border width'),
('borderRadius', '"0.375rem"', 'Default border radius'),
('primaryColor', '"#3b82f6"', 'Primary theme color'),
('backgroundColor', '"#ffffff"', 'Background color'),
('logoUrl', '""', 'URL for the logo'),
('faviconUrl', '""', 'URL for the favicon'),
('metaTitle', '"PPP Hillegom"', 'Meta title for the application'),
('rankingType', '"handmatig"', 'Ranking calculation type: handmatig or automatisch')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
