
-- Zorg ervoor dat vincebalk@gmail.com een super admin is
INSERT INTO public.admin_users (user_id, email, is_super_admin, created_at)
SELECT 
  id,
  'vincebalk@gmail.com',
  true,
  now()
FROM auth.users 
WHERE email = 'vincebalk@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  is_super_admin = true,
  email = EXCLUDED.email;

-- Update het profiel om beheerder rol te hebben
UPDATE public.profiles 
SET role = 'beheerder', updated_at = now()
WHERE email = 'vincebalk@gmail.com';

-- Als het profiel niet bestaat, maak het aan
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  'vincebalk@gmail.com',
  'beheerder',
  now(),
  now()
FROM auth.users 
WHERE email = 'vincebalk@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'beheerder',
  updated_at = now();
