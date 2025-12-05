-- Create supplier_visits table
CREATE TABLE IF NOT EXISTS public.supplier_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    visit_date TIMESTAMPTZ NOT NULL,
    products TEXT,
    amount NUMERIC(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.supplier_visits ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.supplier_visits;
CREATE POLICY "Enable read access for authenticated users" ON public.supplier_visits
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.supplier_visits;
CREATE POLICY "Enable insert access for authenticated users" ON public.supplier_visits
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.supplier_visits;
CREATE POLICY "Enable update access for authenticated users" ON public.supplier_visits
    FOR UPDATE
    TO authenticated
    USING (true);
