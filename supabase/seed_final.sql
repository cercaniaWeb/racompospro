-- Database Seeder for Racom POS - FINAL VERSION
-- Based on actual schema from database
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Create Categories
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bebidas') THEN
    INSERT INTO categories (name, description) VALUES
    ('Bebidas', 'Bebidas frías y calientes'),
    ('Snacks', 'Botanas y aperitivos'),
    ('Lácteos', 'Productos lácteos y derivados'),
    ('Panadería', 'Pan y productos de panadería'),
    ('Limpieza', 'Artículos de limpieza'),
    ('Abarrotes', 'Productos básicos de despensa'),
    ('Congelados', 'Productos congelados'),
    ('Frutas y Verduras', 'Productos frescos');
  END IF;
END $$;

-- ============================================
-- PART 2: Create Products (50 products)
-- ============================================
DO $$
DECLARE
  cat_bebidas uuid;
  cat_snacks uuid;
  cat_lacteos uuid;
  cat_panaderia uuid;
  cat_limpieza uuid;
  cat_abarrotes uuid;
  cat_congelados uuid;
  cat_frutas uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_bebidas FROM categories WHERE name = 'Bebidas';
  SELECT id INTO cat_snacks FROM categories WHERE name = 'Snacks';
  SELECT id INTO cat_lacteos FROM categories WHERE name = 'Lácteos';
  SELECT id INTO cat_panaderia FROM categories WHERE name = 'Panadería';
  SELECT id INTO cat_limpieza FROM categories WHERE name = 'Limpieza';
  SELECT id INTO cat_abarrotes FROM categories WHERE name = 'Abarrotes';
  SELECT id INTO cat_congelados FROM categories WHERE name = 'Congelados';
  SELECT id INTO cat_frutas FROM categories WHERE name = 'Frutas y Verduras';

  IF NOT EXISTS (SELECT 1 FROM products WHERE sku = '7501055300006') THEN
    -- Bebidas
    INSERT INTO products (name, sku, barcode, price, cost, category_id, description, min_stock, unit) VALUES
    ('Coca-Cola 600ml', '7501055300006', '7501055300006', 20.00, 15.00, cat_bebidas, 'Refresco de cola', 12, 'pieza'),
    ('Pepsi 600ml', '7501055300013', '7501055300013', 19.00, 14.00, cat_bebidas, 'Refresco de cola', 12, 'pieza'),
    ('Agua Ciel 1L', '7501055301000', '7501055301000', 12.00, 8.00, cat_bebidas, 'Agua purificada', 15, 'pieza'),
    ('Jugo Del Valle 1L', '7501055302000', '7501055302000', 25.00, 18.00, cat_bebidas, 'Jugo de naranja', 10, 'pieza'),
    ('Café Nescafé 200g', '7501055303000', '7501055303000', 89.00, 65.00, cat_bebidas, 'Café soluble', 5, 'pieza'),
    
    -- Snacks
    ('Sabritas Original 45g', '7501055304000', '7501055304000', 17.00, 12.00, cat_snacks, 'Papas fritas', 20, 'pieza'),
    ('Doritos Nacho 58g', '7501055305000', '7501055305000', 19.00, 14.00, cat_snacks, 'Totopos de maíz', 20, 'pieza'),
    ('Cheetos Poffs 42g', '7501055306000', '7501055306000', 18.00, 13.00, cat_snacks, 'Botana de queso', 20, 'pieza'),
    ('Cacahuates Japoneses 100g', '7501055307000', '7501055307000', 28.00, 20.00, cat_snacks, 'Cacahuates enchilados', 15, 'pieza'),
    ('Chocolates M&M 47g', '7501055308000', '7501055308000', 25.00, 18.00, cat_snacks, 'Chocolates de colores', 15, 'pieza'),
    
    -- Lácteos
    ('Leche Lala 1L', '7501055309000', '7501055309000', 24.00, 18.00, cat_lacteos, 'Leche entera', 10, 'pieza'),
    ('Yogurt Yoplait 1L', '7501055310000', '7501055310000', 38.00, 28.00, cat_lacteos, 'Yogurt natural', 8, 'pieza'),
    ('Queso Oaxaca 300g', '7501055311000', '7501055311000', 62.00, 45.00, cat_lacteos, 'Queso de hebra', 8, 'pieza'),
    ('Mantequilla Lala 90g', '7501055312000', '7501055312000', 30.00, 22.00, cat_lacteos, 'Mantequilla con sal', 10, 'pieza'),
    ('Crema Lala 200ml', '7501055313000', '7501055313000', 21.00, 15.00, cat_lacteos, 'Crema ácida', 10, 'pieza'),
    
    -- Panadería
    ('Pan Blanco Bimbo', '7501055314000', '7501055314000', 38.00, 28.00, cat_panaderia, 'Pan de caja blanco', 8, 'pieza'),
    ('Pan Integral Bimbo', '7501055315000', '7501055315000', 42.00, 32.00, cat_panaderia, 'Pan de caja integral', 8, 'pieza'),
    ('Donas Bimbo 6pz', '7501055316000', '7501055316000', 34.00, 25.00, cat_panaderia, 'Donas azucaradas', 10, 'pieza'),
    ('Galletas Marías 200g', '7501055317000', '7501055317000', 25.00, 18.00, cat_panaderia, 'Galletas dulces', 15, 'pieza'),
    ('Galletas Chokis 126g', '7501055318000', '7501055318000', 28.00, 20.00, cat_panaderia, 'Galletas con chispas', 15, 'pieza'),
    
    -- Limpieza
    ('Jabón Zote 200g', '7501055319000', '7501055319000', 18.00, 12.00, cat_limpieza, 'Jabón para ropa', 12, 'pieza'),
    ('Cloro Cloralex 1L', '7501055320000', '7501055320000', 30.00, 22.00, cat_limpieza, 'Cloro desinfectante', 10, 'pieza'),
    ('Detergente Ariel 1kg', '7501055321000', '7501055321000', 78.00, 58.00, cat_limpieza, 'Detergente en polvo', 8, 'pieza'),
    ('Suavitel 850ml', '7501055322000', '7501055322000', 44.00, 32.00, cat_limpieza, 'Suavizante de telas', 10, 'pieza'),
    ('Shampoo H&S 375ml', '7501055323000', '7501055323000', 65.00, 48.00, cat_limpieza, 'Shampoo anticaspa', 8, 'pieza'),
    
    -- Abarrotes
    ('Arroz Verde Valle 1kg', '7501055324000', '7501055324000', 25.00, 18.00, cat_abarrotes, 'Arroz blanco', 10, 'pieza'),
    ('Frijol La Costeña 560g', '7501055325000', '7501055325000', 30.00, 22.00, cat_abarrotes, 'Frijoles refritos', 12, 'pieza'),
    ('Atún Tuny 140g', '7501055326000', '7501055326000', 25.00, 18.00, cat_abarrotes, 'Atún en agua', 15, 'pieza'),
    ('Sopa Nissin Cup 64g', '7501055327000', '7501055327000', 17.00, 12.00, cat_abarrotes, 'Sopa instantánea', 20, 'pieza'),
    ('Aceite Capullo 1L', '7501055328000', '7501055328000', 52.00, 38.00, cat_abarrotes, 'Aceite vegetal', 8, 'pieza'),
    
    -- Congelados
    ('Pizza Delimex', '7501055329000', '7501055329000', 62.00, 45.00, cat_congelados, 'Pizza congelada', 5, 'pieza'),
    ('Helado Holanda 1L', '7501055330000', '7501055330000', 75.00, 55.00, cat_congelados, 'Helado de vainilla', 5, 'pieza'),
    ('Nuggets FUD 400g', '7501055331000', '7501055331000', 70.00, 52.00, cat_congelados, 'Nuggets de pollo', 8, 'pieza'),
    ('Papas McCain 900g', '7501055332000', '7501055332000', 58.00, 42.00, cat_congelados, 'Papas a la francesa', 8, 'pieza'),
    ('Verduras Mixtas 1kg', '7501055333000', '7501055333000', 48.00, 35.00, cat_congelados, 'Verduras congeladas', 10, 'pieza'),
    
    -- Frutas y Verduras
    ('Plátanos kg', '2001000001', '2001000001', 22.00, 15.00, cat_frutas, 'Plátanos frescos', 5, 'kg'),
    ('Manzanas kg', '2001000002', '2001000002', 38.00, 28.00, cat_frutas, 'Manzanas rojas', 5, 'kg'),
    ('Naranjas kg', '2001000003', '2001000003', 25.00, 18.00, cat_frutas, 'Naranjas dulces', 5, 'kg'),
    ('Tomates kg', '2001000004', '2001000004', 30.00, 22.00, cat_frutas, 'Tomates frescos', 5, 'kg'),
    ('Cebollas kg', '2001000005', '2001000005', 28.00, 20.00, cat_frutas, 'Cebollas blancas', 5, 'kg'),
    
    -- Productos adicionales
    ('Huevos San Juan 12pz', '7501055334000', '7501055334000', 52.00, 38.00, cat_lacteos, 'Huevos frescos', 8, 'pieza'),
    ('Tortillas 1kg', '7501055335000', '7501055335000', 25.00, 18.00, cat_panaderia, 'Tortillas de maíz', 15, 'pieza'),
    ('Jamón FUD 200g', '7501055336000', '7501055336000', 58.00, 42.00, cat_lacteos, 'Jamón de pavo', 8, 'pieza'),
    ('Salchicha FUD 500g', '7501055337000', '7501055337000', 52.00, 38.00, cat_lacteos, 'Salchichas de pavo', 10, 'pieza'),
    ('Chile Jalapeño 220g', '7501055338000', '7501055338000', 21.00, 15.00, cat_abarrotes, 'Chile en vinagre', 12, 'pieza'),
    ('Mayonesa McCormick 380g', '7501055339000', '7501055339000', 44.00, 32.00, cat_abarrotes, 'Mayonesa', 10, 'pieza'),
    ('Ketchup Heinz 397g', '7501055340000', '7501055340000', 38.00, 28.00, cat_abarrotes, 'Salsa catsup', 12, 'pieza'),
    ('Papel Higiénico Pétalo 4pz', '7501055341000', '7501055341000', 38.00, 28.00, cat_limpieza, 'Papel higiénico', 10, 'pieza'),
    ('Toallas Femeninas Saba 10pz', '7501055342000', '7501055342000', 48.00, 35.00, cat_limpieza, 'Toallas sanitarias', 8, 'pieza'),
    ('Pañales Huggies 40pz', '7501055343000', '7501055343000', 248.00, 185.00, cat_limpieza, 'Pañales etapa 3', 5, 'pieza');
  END IF;
END $$;

-- ============================================
-- PART 3: Initialize Inventory
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM inventory LIMIT 1) THEN
    INSERT INTO inventory (product_id, store_id, stock, min_stock)
    SELECT 
      p.id,
      s.id,
      FLOOR(20 + RANDOM() * 80)::INTEGER as stock,
      p.min_stock
    FROM products p
    CROSS JOIN stores s
    WHERE s.is_active = true
    LIMIT 150; -- Adjust based on number of stores
  END IF;
END $$;

-- ============================================
-- PART 4: Generate Sales (Last 30 Days)
-- ============================================
DO $$
DECLARE
  sale_count integer := 0;
  max_sales integer := 450;
  sale_timestamp timestamp with time zone;
  store_to_use uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sales LIMIT 1) THEN
    -- Generate sales with varying timestamps over last 30 days
    WHILE sale_count < max_sales LOOP
      -- Random timestamp in last 30 days
      sale_timestamp := NOW() - (RANDOM() * INTERVAL '30 days');
      
      -- Random store
      SELECT id INTO store_to_use FROM stores WHERE is_active = true ORDER BY RANDOM() LIMIT 1;
      
      INSERT INTO sales (store_id, total, payment_method, created_at)
      VALUES (
        store_to_use,
        0, -- Will update after items
        CASE FLOOR(RANDOM() * 3)::INTEGER
          WHEN 0 THEN 'cash'
          WHEN 1 THEN 'card'
          ELSE 'transfer'
        END,
        sale_timestamp
      );
      
      sale_count := sale_count + 1;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- PART 5: Generate Sale Items
-- ============================================
DO $$
DECLARE
  sale_rec RECORD;
  product_rec RECORD;
  items_per_sale integer;
  item_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sale_items LIMIT 1) THEN
    -- For each sale, add 1-5 random products
    FOR sale_rec IN SELECT id FROM sales WHERE total = 0 LOOP
      items_per_sale := FLOOR(1 + RANDOM() * 5)::INTEGER;
      item_count := 0;
      
      WHILE item_count < items_per_sale LOOP
        -- Get random product
        SELECT id, price INTO product_rec
        FROM products
        ORDER BY RANDOM()
        LIMIT 1;
        
        INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
        VALUES (
          sale_rec.id,
          product_rec.id,
          FLOOR(1 + RANDOM() * 4)::INTEGER,
          product_rec.price,
          product_rec.price * FLOOR(1 + RANDOM() * 4)::INTEGER
        );
        
        item_count := item_count + 1;
      END LOOP;
    END LOOP;
    
    -- Update sales totals
    UPDATE sales s
    SET total = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM sale_items si
      WHERE si.sale_id = s.id
    )
    WHERE total = 0;
  END IF;
END $$;

-- ============================================
-- PART 6: Update Inventory Based on Sales
-- ============================================
WITH sales_impact AS (
  SELECT 
    si.product_id,
    s.store_id,
    SUM(si.quantity) as total_sold
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  GROUP BY si.product_id, s.store_id
)
UPDATE inventory i
SET stock = GREATEST(0, i.stock - si.total_sold)
FROM sales_impact si
WHERE i.product_id = si.product_id
  AND i.store_id = si.store_id;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  'Database seeded successfully! 🎉' as message,
  (SELECT COUNT(*) FROM stores) as stores,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM inventory) as inventory_records,
  (SELECT COUNT(*) FROM sales) as total_sales,
  (SELECT COUNT(*) FROM sale_items) as sale_items,
  (SELECT COALESCE(SUM(total), 0)::NUMERIC(10,2) FROM sales) as total_revenue,
  (SELECT COUNT(*) FROM inventory WHERE stock < min_stock) as low_stock_products;
