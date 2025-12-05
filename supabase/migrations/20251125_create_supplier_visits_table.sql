-- Create supplier_visits table
CREATE TABLE IF NOT EXISTS public.supplier_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    products TEXT, -- List of products or description
    amount NUMERIC(10, 2),
    notes TEXT,
    visit_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notification_sent BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_visits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.supplier_visits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.supplier_visits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.supplier_visits
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.supplier_visits
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE TRIGGER update_supplier_visits_updated_at
    BEFORE UPDATE ON public.supplier_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
