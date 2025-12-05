/*
 * Migration: Add is_weighted column to products table
 * This enables support for products sold by weight (kg) vs by unit
 * 
 * Execute this SQL in your Supabase SQL Editor
 */

-- Add is_weighted column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN products.is_weighted IS 'Indicates if the product is sold by weight (kg) rather than by unit';

-- Update existing weighted products if any
-- (None yet, but this is how you'd mark them)
-- UPDATE products SET is_weighted = true WHERE sku IN ('CAR-001');
