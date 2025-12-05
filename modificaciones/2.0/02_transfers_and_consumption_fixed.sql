-- Este script debe ejecutarse DESPUÉS de haber creado las tablas:
-- 1. user_profiles
-- 2. stores
-- 3. products

-- =================================================================
-- 1. Tablas para Consumo de Empleados (Merma Autorizada/Gasto)
-- =================================================================
CREATE TABLE IF NOT EXISTS employee_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) NOT NULL,
    employee_id UUID REFERENCES user_profiles(id) NOT NULL,        -- Quién comió
    authorized_by UUID REFERENCES user_profiles(id),               -- Quién dio permiso (puede ser NULL si el rol se auto-autoriza)
    total_cost DECIMAL(10,2) NOT NULL,                            -- Costo total para la empresa (Costo Adquisición)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_consumption_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumption_id UUID REFERENCES employee_consumptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL -- Guardamos el costo al momento del consumo (histórico)
);

-- =================================================================
-- 2. Tablas para Traslados de Inventario
-- =================================================================
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_store_id UUID REFERENCES stores(id) NOT NULL,
    destination_store_id UUID REFERENCES stores(id) NOT NULL,
    
    -- Usuarios que interactúan en el flujo
    requested_by UUID REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    received_by UUID REFERENCES user_profiles(id),
    
    -- Máquina de Estados: requested -> approved -> shipped -> received
    status VARCHAR(20) CHECK (status IN ('requested', 'approved', 'shipped', 'received', 'cancelled')) DEFAULT 'requested',
    
    -- Fechas de auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    
    notes TEXT
);

-- 3. Detalle de Traslados (Crucial para el manejo de discrepancias)
CREATE TABLE IF NOT EXISTS transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) NOT NULL,
    
    qty_requested DECIMAL(10,3) NOT NULL, -- Lo que pidió la tienda
    qty_approved DECIMAL(10,3),           -- Lo que Bodega dice que enviará (tras aprobación/preparación)
    qty_shipped DECIMAL(10,3),            -- Lo que realmente salió de Bodega (al subir al camión)
    qty_received DECIMAL(10,3)            -- Lo que llegó y se contó en la Tienda
    
    -- La diferencia entre shipped y received es la MERMA de traslado
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_dest ON transfers(destination_store_id);
CREATE INDEX idx_consumption_store ON employee_consumptions(store_id);
