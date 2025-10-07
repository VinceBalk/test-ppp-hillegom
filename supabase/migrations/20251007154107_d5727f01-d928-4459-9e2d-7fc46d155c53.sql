-- Make email optional by removing the strict validation constraint
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS check_email_format;

-- Add a lenient constraint that allows NULL, empty string, or valid email format
ALTER TABLE public.players ADD CONSTRAINT check_email_format_lenient
CHECK (
  email IS NULL 
  OR email = ''
  OR (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND length(email) <= 254)
);