-- Fix infinite recursion in RLS policies for users table
-- The issue: policies were querying the users table to check roles, creating a loop
-- Solution: Use a SECURITY DEFINER function to bypass RLS when checking roles

-- First, drop all existing policies
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Gerente can view users from own store" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Gerente can insert users in own store" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Gerente can update users from own store" ON users;
DROP POLICY IF EXISTS "Gerente can update users from own store" ON users;
DROP POLICY IF EXISTS "Gerente can view users" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- Create a SECURITY DEFINER function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policies using the function

-- SELECT policies
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Managers can view users"
ON users FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente'
);

CREATE POLICY "Users can view their own record"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- INSERT policy
CREATE POLICY "Admins and developers can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) IN ('admin', 'dev')
);

-- UPDATE policy
CREATE POLICY "Admins and developers can update users"
ON users FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin', 'dev')
);

-- DELETE policy
CREATE POLICY "Admins and developers can delete users"
ON users FOR DELETE
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('admin', 'dev')
);

-- Add helpful comment
COMMENT ON FUNCTION get_user_role IS 'SECURITY DEFINER function to get user role without triggering RLS recursion';
