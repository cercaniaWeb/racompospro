-- ============================================
-- RACOM POS - SCHEMA INICIAL
-- Ejecutar PRIMERO en Supabase SQL Editor
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: stores
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  type TEXT DEFAULT 'physical',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(10, 2) DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  image_url TEXT,
  min_stock INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'pieza',
  is_weighted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLA: inventory
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(product_id, store_id)
);

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cajera',
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLA: sales
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id),
  customer_id UUID,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  processed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TABLA: sale_items
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- Crear una tienda por defecto si no existe
-- ============================================
INSERT INTO public.stores (name, address, type, is_active)
SELECT 'Tienda Principal', 'Calle Principal #123', 'physical', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1);

-- ============================================
-- Row Level Security (RLS) - DESHABILITADO TEMPORALMENTE
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.stores;
CREATE POLICY "Allow all for authenticated users" ON public.stores FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.categories;
CREATE POLICY "Allow all for authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.products;
CREATE POLICY "Allow all for authenticated users" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.inventory;
CREATE POLICY "Allow all for authenticated users" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.sales;
CREATE POLICY "Allow all for authenticated users" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.sale_items;
CREATE POLICY "Allow all for authenticated users" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- Índices para mejor rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON public.inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);

-- ============================================
-- Resultado
-- ============================================
SELECT 'Schema creado exitosamente! ✅' as message,
       (SELECT COUNT(*) FROM public.stores) as stores_created;
