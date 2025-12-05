-- Add FK from user_stores to user_profiles to enable PostgREST joins
ALTER TABLE public.user_stores
DROP CONSTRAINT IF EXISTS user_stores_user_id_fkey; -- Optional: drop old one if it conflicts or just add new one

-- It's better to keep the auth reference for strictness, but for PostgREST we need a link to a public table.
-- Since user_profiles.id IS auth.users.id, we can reference user_profiles.
ALTER TABLE public.user_stores
ADD CONSTRAINT user_stores_profile_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;
