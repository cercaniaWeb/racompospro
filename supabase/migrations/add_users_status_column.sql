-- Migration: Add status column to users table
-- This fixes the "Could not find the 'status' column" error in user management

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='status'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
        
        RAISE NOTICE 'Added status column to users table';
    ELSE
        RAISE NOTICE 'Status column already exists in users table';
    END IF;
END $$;

-- Update existing users to have 'active' status
UPDATE users 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Add comment to explain the column
COMMENT ON COLUMN users.status IS 'User status: active, inactive, or pending';
