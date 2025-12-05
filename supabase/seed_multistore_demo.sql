-- Seed script for multi-store demo
-- Creates 2 stores, global products, per-store inventory, and batch tracking

-- Clean up existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE inventory_batch_levels, product_batches, inventory, sales, products, stores CASCADE;

-- ========================================
-- 1. CREATE STORES
-- ========================================
INSERT INTO stores (id, name, address, phone, type, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Sucursal Centro', 'Av. Principal #123, Centro', '555-0001', 'central', true, NOW(), NOW()),
  (gen_random_uuid(), 'Sucursal Aeropuerto', 'Terminal 2, Aeropuerto Internacional', '555-0002', 'branch', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get store IDs for later use
DO $$
DECLARE
  centro_id uuid;
  aeropuerto_id uuid;
  prod_cocacola uuid;
  prod_agua uuid;
  prod_jugo uuid;
  prod_papas uuid;
  prod_galletas uuid;
  prod_leche uuid;
  prod_yogurt uuid;
  batch_cc1 uuid;
  batch_cc2 uuid;
  batch_am1 uuid;
  batch_jn1 uuid;
  batch_jn2 uuid;
  batch_le1 uuid;
  batch_le2 uuid;
  batch_yg1 uuid;
BEGIN
  -- Get store IDs
  SELECT id INTO centro_id FROM stores WHERE name = 'Sucursal Centro' LIMIT 1;
  SELECT id INTO aeropuerto_id FROM stores WHERE name = 'Sucursal Aeropuerto' LIMIT 1;

  -- ========================================
  -- 2. CREATE GLOBAL PRODUCTS
  -- ========================================
  
  -- Bebidas (batch tracked)
  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('BEB-001', 'Coca Cola 600ml', 'Refresco de cola', 15.00, 10.00, '7501234567890', true, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_cocacola;

  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('BEB-002', 'Agua Mineral 1L', 'Agua purificada', 12.00, 8.00, '7501234567891', true, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_agua;

  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('BEB-003', 'Jugo Naranja 1L', 'Jugo natural', 25.00, 18.00, '7501234567892', true, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_jugo;

  -- Snacks (no batch tracking)
  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('SNK-001', 'Papas Fritas 150g', 'Papas sabor natural', 18.00, 12.00, '7501234567893', false, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_papas;

  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('SNK-002', 'Galletas Chocolate', 'Paquete de galletas', 22.00, 15.00, '7501234567894', false, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_galletas;

  -- Lácteos (batch tracked)
  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('LAC-001', 'Leche Entera 1L', 'Leche pasteurizada', 20.00, 14.00, '7501234567895', true, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_leche;

  INSERT INTO products (sku, name, description, price, cost, barcode, is_batch_tracked, unit, created_at, updated_at)
  VALUES ('LAC-002', 'Yogurt Natural 1L', 'Yogurt sin azúcar', 28.00, 20.00, '7501234567896', true, 'unidad', NOW(), NOW())
  ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO prod_yogurt;

  -- ========================================
  -- 3. CREATE INVENTORY FOR SUCURSAL CENTRO
  -- ========================================
  INSERT INTO inventory (product_id, store_id, stock, custom_selling_price, is_active, min_stock, created_at, updated_at) VALUES
    (prod_cocacola, centro_id, 50, 14.00, true, 10, NOW(), NOW()),
    (prod_agua, centro_id, 80, 11.00, true, 20, NOW(), NOW()),
    (prod_jugo, centro_id, 30, 24.00, true, 10, NOW(), NOW()),
    (prod_papas, centro_id, 100, NULL, true, 20, NOW(), NOW()),
    (prod_galletas, centro_id, 75, NULL, true, 15, NOW(), NOW()),
    (prod_leche, centro_id, 40, 19.00, true, 10, NOW(), NOW()),
    (prod_yogurt, centro_id, 25, 27.00, true, 5, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- 4. CREATE INVENTORY FOR SUCURSAL AEROPUERTO
  -- ========================================
  INSERT INTO inventory (product_id, store_id, stock, custom_selling_price, is_active, min_stock, created_at, updated_at) VALUES
    (prod_cocacola, aeropuerto_id, 30, 20.00, true, 10, NOW(), NOW()),
    (prod_agua, aeropuerto_id, 40, 16.00, true, 15, NOW(), NOW()),
    (prod_jugo, aeropuerto_id, 20, 30.00, true, 5, NOW(), NOW()),
    (prod_papas, aeropuerto_id, 60, 22.00, true, 15, NOW(), NOW()),
    (prod_galletas, aeropuerto_id, 50, 26.00, true, 10, NOW(), NOW()),
    (prod_leche, aeropuerto_id, 25, 24.00, true, 8, NOW(), NOW()),
    (prod_yogurt, aeropuerto_id, 15, 32.00, true, 5, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- 5. CREATE PRODUCT BATCHES
  -- ========================================
  INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, created_at)
  VALUES 
    (prod_cocacola, 'LOTE-CC-2025-05', '2025-05-01', '2025-11-01', NOW()),
    (prod_cocacola, 'LOTE-CC-2025-06', '2025-06-01', '2025-12-01', NOW()),
    (prod_agua, 'LOTE-AM-2025-11', '2025-11-15', '2026-11-15', NOW()),
    (prod_jugo, 'LOTE-JN-2025-11', '2025-11-15', '2025-12-15', NOW()),
    (prod_jugo, 'LOTE-JN-2025-12', '2025-11-20', '2026-01-20', NOW()),
    (prod_leche, 'LOTE-LE-2025-11A', '2025-11-20', '2025-12-05', NOW()),
    (prod_leche, 'LOTE-LE-2025-11B', '2025-11-22', '2025-12-10', NOW()),
    (prod_yogurt, 'LOTE-YG-2025-11', '2025-11-18', '2025-12-18', NOW())
  ON CONFLICT DO NOTHING;

  -- Get batch IDs
  SELECT id INTO batch_cc1 FROM product_batches WHERE batch_number = 'LOTE-CC-2024-11' LIMIT 1;
  SELECT id INTO batch_cc2 FROM product_batches WHERE batch_number = 'LOTE-CC-2024-12' LIMIT 1;
  SELECT id INTO batch_am1 FROM product_batches WHERE batch_number = 'LOTE-AM-2024-11' LIMIT 1;
  SELECT id INTO batch_jn1 FROM product_batches WHERE batch_number = 'LOTE-JN-2024-10' LIMIT 1;
  SELECT id INTO batch_jn2 FROM product_batches WHERE batch_number = 'LOTE-JN-2024-11' LIMIT 1;
  SELECT id INTO batch_le1 FROM product_batches WHERE batch_number = 'LOTE-LE-2024-11A' LIMIT 1;
  SELECT id INTO batch_le2 FROM product_batches WHERE batch_number = 'LOTE-LE-2024-11B' LIMIT 1;
  SELECT id INTO batch_yg1 FROM product_batches WHERE batch_number = 'LOTE-YG-2024-11' LIMIT 1;

  -- ========================================
  -- 6. ASSIGN BATCHES TO STORE INVENTORY
  -- ========================================
  -- Sucursal Centro
  INSERT INTO inventory_batch_levels (store_id, batch_id, quantity, location_in_store, updated_at) VALUES
    (centro_id, batch_cc1, 30, 'Refrigerador A1', NOW()),
    (centro_id, batch_cc2, 20, 'Refrigerador A2', NOW()),
    (centro_id, batch_am1, 80, 'Almacén B', NOW()),
    (centro_id, batch_jn1, 15, 'Refrigerador C1', NOW()),
    (centro_id, batch_jn2, 15, 'Refrigerador C2', NOW()),
    (centro_id, batch_le1, 20, 'Refrigerador D1', NOW()),
    (centro_id, batch_le2, 20, 'Refrigerador D2', NOW()),
    (centro_id, batch_yg1, 25, 'Refrigerador E', NOW())
  ON CONFLICT DO NOTHING;

  -- Sucursal Aeropuerto
  INSERT INTO inventory_batch_levels (store_id, batch_id, quantity, location_in_store, updated_at) VALUES
    (aeropuerto_id, batch_cc1, 20, 'Vitrina 1', NOW()),
    (aeropuerto_id, batch_cc2, 10, 'Vitrina 2', NOW()),
    (aeropuerto_id, batch_am1, 40, 'Bodega Principal', NOW()),
    (aeropuerto_id, batch_jn1, 10, 'Vitrina 3', NOW()),
    (aeropuerto_id, batch_jn2, 10, 'Vitrina 4', NOW()),
    (aeropuerto_id, batch_le1, 12, 'Refrigerador A', NOW()),
    (aeropuerto_id, batch_le2, 13, 'Refrigerador B', NOW()),
    (aeropuerto_id, batch_yg1, 15, 'Refrigerador C', NOW())
  ON CONFLICT DO NOTHING;

END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- View stores
SELECT id, name, type, is_active FROM stores ORDER BY name;

-- View products
SELECT id, sku, name, price, is_batch_tracked FROM products ORDER BY sku;

-- View inventory by store
SELECT 
  s.name as tienda,
  p.name as producto,
  i.stock,
  COALESCE(i.custom_selling_price, p.price) as precio_efectivo,
  p.price as precio_global
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
ORDER BY s.name, p.name;

-- View expiring products
SELECT * FROM expiring_products ORDER BY days_until_expiry;
