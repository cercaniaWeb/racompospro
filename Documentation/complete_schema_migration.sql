-- ========================================
-- MIGRACIÓN COMPLETA AL ESQUEMA ORIGINAL
-- Ejecutar en: https://supabase.com/dashboard/project/gdkpwsgcqwvsxghvoqmu/sql
-- ========================================

-- ========================================
-- PARTE 1: Actualizar tablas existentes
-- ========================================

-- Actualizar products con todos los campos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS measurement_unit VARCHAR DEFAULT 'un',
ADD COLUMN IF NOT EXISTS barcode_prefix VARCHAR,
RENAME COLUMN price TO selling_price,
RENAME COLUMN cost TO cost_price;

-- Actualizar inventory
ALTER TABLE inventory
RENAME COLUMN quantity TO stock;

-- Actualizar sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS cash_session_id UUID REFERENCES cash_sessions(id),
ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ DEFAULT NOW(),
RENAME COLUMN total_amount TO total_amount;

-- ========================================
-- PARTE 2: Crear tablas de gestión de caja
-- ========================================

CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID REFERENCES user_profiles(id),
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  theoretical_balance NUMERIC,
  closing_balance NUMERIC,
  difference NUMERIC,
  status VARCHAR NOT NULL DEFAULT 'open',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  type VARCHAR NOT NULL, -- 'income', 'expense', 'adjustment'
  amount NUMERIC NOT NULL,
  description TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  requested_amount NUMERIC NOT NULL,
  charged_amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL,
  given_cash NUMERIC NOT NULL,
  processed_by UUID NOT NULL REFERENCES user_profiles(id),
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  payment_method VARCHAR NOT NULL, -- 'cash', 'card', 'transfer'
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 3: Crear tablas de lotes
-- ========================================

CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  batch_number VARCHAR NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE NOT NULL,
  cost_override NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_batch_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  batch_id UUID NOT NULL REFERENCES product_batches(id),
  quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  location_in_store VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 4: Crear tablas de consumo de empleados
-- ========================================

CREATE TABLE IF NOT EXISTS employee_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  employee_id UUID NOT NULL REFERENCES user_profiles(id),
  authorized_by UUID REFERENCES user_profiles(id),
  total_cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_consumption_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_id UUID REFERENCES employee_consumptions(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL
);

-- ========================================
-- PARTE 5: Crear sistema de transferencias completo
-- ========================================

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_store_id UUID NOT NULL REFERENCES stores(id),
  destination_store_id UUID NOT NULL REFERENCES stores(id),
  requested_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  received_by UUID REFERENCES user_profiles(id),
  status VARCHAR DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'shipped', 'received', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES transfers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty_requested NUMERIC NOT NULL,
  qty_approved NUMERIC,
  qty_shipped NUMERIC,
  qty_received NUMERIC
);

-- Actualizar tablas existentes de transferencias
ALTER TABLE inventory_transfer_items
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES product_batches(id);

ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES product_batches(id);

-- ========================================
-- PARTE 6: Habilitar RLS en nuevas tablas
-- ========================================

ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batch_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_consumption_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTE 7: Políticas RLS básicas
-- ========================================

-- Cash sessions: Solo usuarios de la sucursal
CREATE POLICY "Users can view cash sessions from their stores"
ON cash_sessions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE user_stores.store_id = cash_sessions.store_id 
        AND user_stores.user_id = auth.uid()
    )
    OR (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- Transfers: Usuarios pueden ver transferencias de sus sucursales
CREATE POLICY "Users can view transfers from their stores"
ON transfers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE (user_stores.store_id = transfers.origin_store_id 
               OR user_stores.store_id = transfers.destination_store_id)
        AND user_stores.user_id = auth.uid()
    )
    OR (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- Product batches: Todos pueden ver
CREATE POLICY "Anyone can read product batches"
ON product_batches FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- PARTE 8: Crear índices
-- ========================================

CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_id ON cash_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_transfers_origin_store ON transfers(origin_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_destination_store ON transfers(destination_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
