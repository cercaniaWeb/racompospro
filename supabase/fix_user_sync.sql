-- Fix: Sync auth.users to user_profiles and assign stores
-- This solves the disconnection between authentication and app data

-- STEP 1: Create or update user_profiles from auth.users
INSERT INTO user_profiles (id, email, name, role, status)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    COALESCE(au.raw_user_meta_data->>'role', 'cajero'),
    'active'
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(user_profiles.name, EXCLUDED.name),
    updated_at = NOW();

-- STEP 2: Assign all users to the first active store (if not already assigned)
INSERT INTO user_stores (user_id, store_id)
SELECT 
    up.id,
    (SELECT id FROM stores WHERE is_active = true ORDER BY created_at LIMIT 1)
FROM user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM user_stores us WHERE us.user_id = up.id
);

-- STEP 3: Create trigger to auto-sync new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, email, name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'cajero'),
        'active'
    );
    
    -- Assign to first active store
    INSERT INTO public.user_stores (user_id, store_id)
    SELECT 
        NEW.id,
        id
    FROM public.stores
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Verification queries
SELECT 'Step 1: User Profiles Created' as step,
       COUNT(*) as total
FROM user_profiles;

SELECT 'Step 2: Users Assigned to Stores' as step,
       COUNT(*) as total
FROM user_stores;

SELECT 'Step 3: Verification - Users with Store Assignment' as step,
       up.email,
       s.name as assigned_store
FROM user_profiles up
LEFT JOIN user_stores us ON us.user_id = up.id
LEFT JOIN stores s ON s.id = us.store_id
ORDER BY up.email;

-- Success message
SELECT '✅ Users synced and assigned to stores!' as message;
