-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
