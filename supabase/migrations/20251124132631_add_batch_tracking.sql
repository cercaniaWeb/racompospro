-- Migration: Add batch tracking support
-- Enables expiry date management for perishable products

-- Add is_batch_tracked to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_batch_tracked BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.is_batch_tracked IS 'Whether this product requires batch/lot tracking with expiry dates';

-- Ensure product_batches table exists (should already be defined in schema)
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(100) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE NOT NULL,
  cost_override DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, batch_number)
);

-- Ensure inventory_batch_levels table exists
CREATE TABLE IF NOT EXISTS inventory_batch_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  location_in_store VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, batch_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_store ON inventory_batch_levels(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_batch ON inventory_batch_levels(batch_id);

-- Create view for expiring products (next 30 days)
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pb.id as batch_id,
  pb.batch_number,
  pb.expiry_date,
  ibl.store_id,
  ibl.quantity,
  EXTRACT(DAY FROM (pb.expiry_date::timestamp - CURRENT_DATE::timestamp)) as days_until_expiry
FROM products p
JOIN product_batches pb ON p.id = pb.product_id
JOIN inventory_batch_levels ibl ON pb.id = ibl.batch_id
WHERE pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND ibl.quantity > 0
ORDER BY pb.expiry_date ASC;
