-- Migration: Add per-store pricing to inventory table
-- This enables each store to have custom prices and control product visibility

-- First, rename quantity column to stock (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE inventory RENAME COLUMN quantity TO stock;
  END IF;
END $$;

-- Add new columns to inventory table
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS custom_selling_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS custom_cost_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_stock INTEGER;

-- Add comment to explain the custom price logic
COMMENT ON COLUMN inventory.custom_selling_price IS 'Store-specific selling price. If NULL, uses product.selling_price';
COMMENT ON COLUMN inventory.custom_cost_price IS 'Store-specific cost price. If NULL, uses product.cost_price';
COMMENT ON COLUMN inventory.is_active IS 'Whether this product is visible/sellable in this store';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_store_active ON inventory(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(store_id) WHERE stock < min_stock;

-- Update existing records to be active by default
UPDATE inventory SET is_active = true WHERE is_active IS NULL;
