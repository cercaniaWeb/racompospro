-- Ensure users table has proper UUID auto-generation
-- This fixes the "null value in column 'id'" error

-- Check and fix the id column to have proper default
DO $$ 
BEGIN
    -- First, check if the column exists and what its default is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id'
    ) THEN
        -- Drop the existing default if any
        ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
        
        -- Set the proper default with gen_random_uuid()
        ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        RAISE NOTICE 'Updated id column default to gen_random_uuid()';
    ELSE
        RAISE EXCEPTION 'users table or id column does not exist';
    END IF;
END $$;

-- Verify the setup
DO $$
DECLARE
    default_value TEXT;
BEGIN
    SELECT column_default INTO default_value
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id';
    
    RAISE NOTICE 'Current default for users.id: %', default_value;
END $$;

-- Test that UUID generation works
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    test_uuid := gen_random_uuid();
    RAISE NOTICE 'UUID generation test successful: %', test_uuid;
END $$;

COMMENT ON COLUMN users.id IS 'Auto-generated UUID using gen_random_uuid()';
