-- Database Seeder for Racom POS - SIMPLIFIED VERSION
-- Populates database with ~1 month of realistic operations
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Clean existing seed data (optional)
-- ============================================
-- Uncomment to start fresh (WARNING: Deletes ALL data):
-- TRUNCATE sales_items, sales, inventory, products, categories CASCADE;

-- ============================================
-- PART 2: Create Categories (if not exist)
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
-- PART 3: Create Products (50 products)
-- ============================================
-- Only insert if no products exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    WITH product_data AS (
      SELECT * FROM (VALUES
        -- Bebidas
        ('Coca-Cola 600ml', 'Bebidas', '7501055300006', 15.00, 20.00, 'Refresco de cola', 'PepsiCo'),
        ('Pepsi 600ml', 'Bebidas', '7501055300013', 14.00, 19.00, 'Refresco de cola', 'PepsiCo'),
        ('Agua Ciel 1L', 'Bebidas', '7501055301000', 8.00, 12.00, 'Agua purificada', 'Coca-Cola'),
        ('Jugo Del Valle 1L', 'Bebidas', '7501055302000', 18.00, 25.00, 'Jugo de naranja', 'Coca-Cola'),
        ('Café Nescafé 200g', 'Bebidas', '7501055303000', 65.00, 89.00, 'Café soluble', 'Nestlé'),
        
        -- Snacks
        ('Sabritas Original 45g', 'Snacks', '7501055304000', 12.00, 17.00, 'Papas fritas', 'PepsiCo'),
        ('Doritos Nacho 58g', 'Snacks', '7501055305000', 14.00, 19.00, 'Totopos de maíz', 'PepsiCo'),
        ('Cheetos Poffs 42g', 'Snacks', '7501055306000', 13.00, 18.00, 'Botana de queso', 'PepsiCo'),
        ('Cacahuates Japoneses 100g', 'Snacks', '7501055307000', 20.00, 28.00, 'Cacahuates enchilados', 'Barcel'),
        ('Chocolates M&M 47g', 'Snacks', '7501055308000', 18.00, 25.00, 'Chocolates de colores', 'Mars'),
        
        -- Lácteos
        ('Leche Lala 1L', 'Lácteos', '7501055309000', 18.00, 24.00, 'Leche entera', 'Grupo Lala'),
        ('Yogurt Yoplait 1L', 'Lácteos', '7501055310000', 28.00, 38.00, 'Yogurt natural', 'General Mills'),
        ('Queso Oaxaca 300g', 'Lácteos', '7501055311000', 45.00, 62.00, 'Queso de hebra', 'FUD'),
        ('Mantequilla Lala 90g', 'Lácteos', '7501055312000', 22.00, 30.00, 'Mantequilla con sal', 'Grupo Lala'),
        ('Crema Lala 200ml', 'Lácteos', '7501055313000', 15.00, 21.00, 'Crema ácida', 'Grupo Lala'),
        
        -- Panadería
        ('Pan Blanco Bimbo', 'Panadería', '7501055314000', 28.00, 38.00, 'Pan de caja blanco', 'Grupo Bimbo'),
        ('Pan Integral Bimbo', 'Panadería', '7501055315000', 32.00, 42.00, 'Pan de caja integral', 'Grupo Bimbo'),
        ('Donas Bimbo 6pz', 'Panadería', '7501055316000', 25.00, 34.00, 'Donas azucaradas', 'Grupo Bimbo'),
        ('Galletas Marías 200g', 'Panadería', '7501055317000', 18.00, 25.00, 'Galletas dulces', 'Gamesa'),
        ('Galletas Chokis 126g', 'Panadería', '7501055318000', 20.00, 28.00, 'Galletas con chispas', 'Gamesa'),
        
        -- Limpieza
        ('Jabón Zote 200g', 'Limpieza', '7501055319000', 12.00, 18.00, 'Jabón para ropa', 'Casa Marzán'),
        ('Cloro Cloralex 1L', 'Limpieza', '7501055320000', 22.00, 30.00, 'Cloro desinfectante', 'Alen'),
        ('Detergente Ariel 1kg', 'Limpieza', '7501055321000', 58.00, 78.00, 'Detergente en polvo', 'P&G'),
        ('Suavitel 850ml', 'Limpieza', '7501055322000', 32.00, 44.00, 'Suavizante de telas', 'Colgate'),
        ('Shampoo H&S 375ml', 'Limpieza', '7501055323000', 48.00, 65.00, 'Shampoo anticaspa', 'P&G'),
        
        -- Abarrotes
        ('Arroz Verde Valle 1kg', 'Abarrotes', '7501055324000', 18.00, 25.00, 'Arroz blanco', 'Verde Valle'),
        ('Frijol La Costeña 560g', 'Abarrotes', '7501055325000', 22.00, 30.00, 'Frijoles refritos', 'Herdez'),
        ('Atún Tuny 140g', 'Abarrotes', '7501055326000', 18.00, 25.00, 'Atún en agua', 'Herdez'),
        ('Sopa Nissin Cup 64g', 'Abarrotes', '7501055327000', 12.00, 17.00, 'Sopa instantánea', 'Nissin'),
        ('Aceite Capullo 1L', 'Abarrotes', '7501055328000', 38.00, 52.00, 'Aceite vegetal', 'Capullo'),
        
        -- Congelados
        ('Pizza Delimex', 'Congelados', '7501055329000', 45.00, 62.00, 'Pizza congelada', 'Nestlé'),
        ('Helado Holanda 1L', 'Congelados', '7501055330000', 55.00, 75.00, 'Helado de vainilla', 'Holanda'),
        ('Nuggets FUD 400g', 'Congelados', '7501055331000', 52.00, 70.00, 'Nuggets de pollo', 'FUD'),
        ('Papas McCain 900g', 'Congelados', '7501055332000', 42.00, 58.00, 'Papas a la francesa', 'McCain'),
        ('Verduras Mixtas 1kg', 'Congelados', '7501055333000', 35.00, 48.00, 'Verduras congeladas', 'Del Monte'),
        
        -- Frutas y Verduras
        ('Plátanos kg', 'Frutas y Verduras', '2001000001', 15.00, 22.00, 'Plátanos frescos', 'Local'),
        ('Manzanas kg', 'Frutas y Verduras', '2001000002', 28.00, 38.00, 'Manzanas rojas', 'Local'),
        ('Naranjas kg', 'Frutas y Verduras', '2001000003', 18.00, 25.00, 'Naranjas dulces', 'Local'),
        ('Tomates kg', 'Frutas y Verduras', '2001000004', 22.00, 30.00, 'Tomates frescos', 'Local'),
        ('Cebollas kg', 'Frutas y Verduras', '2001000005', 20.00, 28.00, 'Cebollas blancas', 'Local'),
        
        -- Productos adicionales
        ('Huevos San Juan 12pz', 'Lácteos', '7501055334000', 38.00, 52.00, 'Huevos frescos', 'San Juan'),
        ('Tortillas 1kg', 'Panadería', '7501055335000', 18.00, 25.00, 'Tortillas de maíz', 'Local'),
        ('Jamón FUD 200g', 'Lácteos', '7501055336000', 42.00, 58.00, 'Jamón de pavo', 'FUD'),
        ('Salchicha FUD 500g', 'Lácteos', '7501055337000', 38.00, 52.00, 'Salchichas de pavo', 'FUD'),
        ('Chile Jalapeño 220g', 'Abarrotes', '7501055338000', 15.00, 21.00, 'Chile en vinagre', 'La Costeña'),
        ('Mayonesa McCormick 380g', 'Abarrotes', '7501055339000', 32.00, 44.00, 'Mayonesa', 'McCormick'),
        ('Ketchup Heinz 397g', 'Abarrotes', '7501055340000', 28.00, 38.00, 'Salsa catsup', 'Heinz'),
        ('Papel Higiénico Pétalo 4pz', 'Limpieza', '7501055341000', 28.00, 38.00, 'Papel higiénico', 'CMPC'),
        ('Toallas Femeninas Saba 10pz', 'Limpieza', '7501055342000', 35.00, 48.00, 'Toallas sanitarias', 'P&G'),
        ('Pañales Huggies 40pz', 'Limpieza', '7501055343000', 185.00, 248.00, 'Pañales etapa 3', 'Kimberly-Clark')
      ) AS t(name, category, sku, cost, price, description, supplier)
    ),
    categories_lookup AS (
      SELECT id, name FROM categories
    )
    INSERT INTO products (name, category_id, sku, cost, price, description, supplier, is_active, min_stock)
    SELECT 
      pd.name,
      cl.id,
      pd.sku,
      pd.cost,
      pd.price,
      pd.description,
      pd.supplier,
      true,
      CASE 
        WHEN pd.category = 'Frutas y Verduras' THEN 5
        WHEN pd.category = 'Lácteos' THEN 8
        WHEN pd.category = 'Bebidas' THEN 12
        ELSE 10
      END as min_stock
    FROM product_data pd
    JOIN categories_lookup cl ON cl.name = pd.category;
  END IF;
END $$;

-- ============================================
-- PART 4: Initialize Inventory
-- ============================================
-- Only if no inventory exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM inventory LIMIT 1) THEN
    WITH store_ids AS (
      SELECT id FROM stores WHERE is_active = true LIMIT 3
    ),
    product_ids AS (
      SELECT id FROM products LIMIT 50
    )
    INSERT INTO inventory (product_id, store_id, stock, last_updated)
    SELECT 
      p.id,
      s.id,
      FLOOR(20 + RANDOM() * 80)::INTEGER,
      NOW() - INTERVAL '30 days'
    FROM product_ids p
    CROSS JOIN store_ids s;
  END IF;
END $$;

-- ============================================
-- PART 5: Generate Sales (Last 30 Days)
-- ============================================
-- Only if no sales exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sales LIMIT 1) THEN
    WITH RECURSIVE dates AS (
      SELECT (NOW() - INTERVAL '30 days')::DATE as sale_date
      UNION ALL
      SELECT (sale_date + INTERVAL '1 day')::DATE
      FROM dates
      WHERE sale_date < NOW()::DATE
    ),
    daily_sales AS (
      SELECT 
        d.sale_date,
        generate_series(1, FLOOR(10 + RANDOM() * 10)::INTEGER) as sale_num
      FROM dates d
    ),
    store_list AS (
      SELECT id FROM stores WHERE is_active = true LIMIT 3
    )
    INSERT INTO sales (store_id, total, payment_method, sale_date, created_at)
    SELECT
      (SELECT id FROM store_list ORDER BY RANDOM() LIMIT 1),
      0,
      CASE FLOOR(RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'card'
        ELSE 'transfer'
      END,
      ds.sale_date + (RANDOM() * INTERVAL '12 hours'),
      ds.sale_date + (RANDOM() * INTERVAL '12 hours')
    FROM daily_sales ds;
  END IF;
END $$;

-- ============================================
-- PART 6: Generate Sale Items
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sale_items LIMIT 1) THEN
    WITH sales_list AS (
      SELECT id FROM sales WHERE total = 0
    ),
    product_list AS (
      SELECT id, price FROM products LIMIT 50
    )
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    SELECT 
      s.id,
      p.id,
      FLOOR(1 + RANDOM() * 4)::INTEGER as quantity,
      p.price,
      (FLOOR(1 + RANDOM() * 4)::INTEGER * p.price)
    FROM sales_list s
    CROSS JOIN LATERAL (
      SELECT id, price 
      FROM product_list 
      ORDER BY RANDOM() 
      LIMIT FLOOR(1 + RANDOM() * 5)::INTEGER
    ) p;

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
-- PART 7: Update Inventory Based on Sales
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
SET stock = GREATEST(0, i.stock - si.total_sold),
    last_updated = NOW()
FROM sales_impact si
WHERE i.product_id = si.product_id
  AND i.store_id = si.store_id;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  'Database seeded successfully!' as message,
  (SELECT COUNT(*) FROM stores) as stores,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM inventory) as inventory_records,
  (SELECT COUNT(*) FROM sales) as sales,
  (SELECT COUNT(*) FROM sale_items) as sale_items,
  (SELECT COALESCE(SUM(total), 0)::NUMERIC(10,2) FROM sales) as total_revenue;
