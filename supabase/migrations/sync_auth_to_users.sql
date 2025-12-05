-- Alternative approach: Handle user sync via application code
-- Since we can't create triggers on auth.users, we'll sync users when they first login

-- Create a public function that syncs a user from auth to users table
-- This will be called from the application after successful authentication

CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
RETURNS void AS $$
DECLARE
  auth_user_id uuid;
  auth_email text;
  user_metadata jsonb;
BEGIN
  -- Get the current authenticated user
  auth_user_id := auth.uid();
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user data from auth.users via a join
  SELECT 
    au.email,
    au.raw_user_meta_data
  INTO 
    auth_email,
    user_metadata
  FROM auth.users au
  WHERE au.id = auth_user_id;

  -- Insert or update in users table
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    auth_user_id,
    auth_email,
    COALESCE(user_metadata->>'name', auth_email),
    COALESCE(user_metadata->>'role', 'cajera'),
    COALESCE(user_metadata->>'status', 'active'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_user_from_auth() TO authenticated;

COMMENT ON FUNCTION public.sync_user_from_auth IS 'Syncs authenticated user from auth.users to public.users. Called on first login.';
