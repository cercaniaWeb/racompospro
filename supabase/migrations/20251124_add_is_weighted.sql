-- Add is_weighted column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN products.is_weighted IS 'Indicates if the product is sold by weight (kg) rather than by unit';
