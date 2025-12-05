-- Simplified RLS Policies for Users Table
-- These policies are much simpler since we don't rely on users table for auth

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Gerente can view users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Authenticated can read users" ON users;
DROP POLICY IF EXISTS "Only service role can write users" ON users;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS public.get_user_role();

-- Create simple policies
-- 1. Anyone authenticated can read users (for displaying names, etc.)
CREATE POLICY "Authenticated users can read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 2. Only service role can write (used by backend API)
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update users"
ON users FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete users"
ON users FOR DELETE
TO service_role
USING (true);

-- Note: Regular users cannot modify the users table directly
-- All modifications go through API routes that use service role
