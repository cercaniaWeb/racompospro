-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Enable read access for own subscriptions" ON public.push_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert access for own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Enable insert access for own subscriptions" ON public.push_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete access for own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Enable delete access for own subscriptions" ON public.push_subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
