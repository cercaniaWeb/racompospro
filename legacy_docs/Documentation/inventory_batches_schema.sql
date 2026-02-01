-- Tabla para control de lotes de productos
CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100), -- Número de lote del proveedor
    expiry_date DATE, -- Fecha de vencimiento (para productos con caducidad)
    manufacturing_date DATE, -- Fecha de fabricación
    supplier TEXT, -- Proveedor del lote
    quantity_received INTEGER NOT NULL DEFAULT 0, -- Cantidad recibida originalmente
    quantity_available INTEGER NOT NULL DEFAULT 0, -- Cantidad disponible actualmente
    quantity_sold INTEGER NOT NULL DEFAULT 0, -- Cantidad vendida de este lote
    cost_per_unit DECIMAL(10, 2), -- Costo por unidad de este lote específico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, batch_number, expiry_date) -- No deben repetirse lotes iguales con mismas fechas
);

-- Índices para búsquedas efectivas de lotes
CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX idx_product_batches_batch_number ON product_batches(batch_number);

-- Tabla para relacionar ventas con lotes específicos (en caso de necesitar rastreabilidad)
CREATE TABLE sale_items_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_item_id UUID REFERENCES sale_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES product_batches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1, -- Unidades vendidas de este lote específico
    cost_per_unit DECIMAL(10, 2), -- Costo del artículo en el momento de la venta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar la tabla de inventario para reflejar la relación con lotes
-- NOTA: Si ya tienes la tabla inventory, esta sería una modificación:
-- ALTER TABLE inventory ADD COLUMN batch_tracking_enabled BOOLEAN DEFAULT FALSE;

-- Función para actualizar la columna 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar 'updated_at' automáticamente en las nuevas tablas
CREATE TRIGGER update_product_batches_updated_at 
    BEFORE UPDATE ON product_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_items_batches_updated_at 
    BEFORE UPDATE ON sale_items_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar automáticamente las cantidades en los lotes
-- cuando se realice una venta
CREATE OR REPLACE FUNCTION update_batch_quantities_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar cantidades en el lote correspondiente
  UPDATE product_batches 
  SET 
    quantity_available = quantity_available - NEW.quantity,
    quantity_sold = quantity_sold + NEW.quantity
  WHERE id = (SELECT batch_id FROM sale_items_batches WHERE sale_item_id = NEW.id LIMIT 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar cantidades de lote cuando se inserta un nuevo item de venta
CREATE TRIGGER update_batch_quantities_trigger
  AFTER INSERT ON sale_items_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_quantities_on_sale();

-- Ejemplo de inserción de un lote:
-- INSERT INTO product_batches (product_id, batch_number, expiry_date, manufacturing_date, supplier, quantity_received, cost_per_unit)
-- VALUES
-- ('id-del-producto', 'LOTE-001-2025', '2025-12-31', '2025-06-01', 'Proveedor ABC', 100, 15.50);