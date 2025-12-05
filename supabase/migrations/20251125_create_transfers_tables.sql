-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    origin_store_id UUID NOT NULL REFERENCES public.stores(id),
    destination_store_id UUID NOT NULL REFERENCES public.stores(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- Create transfer_items table
CREATE TABLE IF NOT EXISTS public.transfer_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;

-- Create policies for transfers
CREATE POLICY "Enable read access for authenticated users" ON public.transfers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.transfers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.transfers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for transfer_items
CREATE POLICY "Enable read access for authenticated users" ON public.transfer_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.transfer_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfers_updated_at
    BEFORE UPDATE ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
