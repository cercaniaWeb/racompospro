-- Este script ha sido corregido para usar la tabla de perfiles de usuario
-- llamada 'users' que está definida en tu esquema actual.

-- =================================================================
-- 1. Tablas para Consumo de Empleados (Merma Autorizada/Gasto)
-- =================================================================
-- El consumo resta inventario de la tienda y se registra como un gasto operativo.
CREATE TABLE IF NOT EXISTS employee_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) NOT NULL,
    employee_id UUID REFERENCES users(id) NOT NULL,        -- Quién consumió
    authorized_by UUID REFERENCES users(id),               -- Quién dio permiso (supervisor, puede ser NULL)
    total_cost DECIMAL(10,2) NOT NULL,                    -- Costo total para la empresa (Costo de Adquisición de los productos)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_consumption_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumption_id UUID REFERENCES employee_consumptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL -- Costo del producto al momento del consumo
);

-- =================================================================
-- 2. Tablas para Traslados de Inventario (Flujo Logístico)
-- =================================================================
-- Tabla Maestra de Traslados
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_store_id UUID REFERENCES stores(id) NOT NULL,      -- Tienda/Bodega que envía
    destination_store_id UUID REFERENCES stores(id) NOT NULL, -- Tienda que recibe
    
    -- Usuarios que interactúan en el flujo
    requested_by UUID REFERENCES users(id), -- Usuario que solicitó el traslado (Origen)
    approved_by UUID REFERENCES users(id),  -- Usuario que aprobó el envío (Bodega/Gerente Central)
    received_by UUID REFERENCES users(id),  -- Usuario que confirmó la recepción (Destino)
    
    -- Máquina de Estados: requested -> approved -> shipped -> received
    status VARCHAR(20) CHECK (status IN ('requested', 'approved', 'shipped', 'received', 'cancelled')) DEFAULT 'requested',
    
    -- Fechas de auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    
    notes TEXT
);

-- 3. Detalle de Traslados (Maneja las discrepancias entre lo enviado y lo recibido)
CREATE TABLE IF NOT EXISTS transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) NOT NULL,
    
    qty_requested DECIMAL(10,3) NOT NULL, -- Lo que pidió la tienda
    qty_approved DECIMAL(10,3),           -- Lo que Bodega dice que enviaría (stock reservado)
    qty_shipped DECIMAL(10,3),            -- Lo que realmente salió de Bodega
    qty_received DECIMAL(10,3)            -- Lo que llegó a la Tienda (esto actualiza el inventario final)
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_dest ON transfers(destination_store_id);
CREATE INDEX idx_consumption_store ON employee_consumptions(store_id);
