-- Insertar categorías de ejemplo
INSERT INTO public.categories (name, description) VALUES
('Lácteos', 'Productos lácteos como leche, queso, yogur'),
('Panadería', 'Pan, bolillos, pasteles y otros productos horneados'),
('Bebidas', 'Refrescos, jugos, agua embotellada'),
('Abarrotes', 'Productos de despensa como arroz, azúcar, frijoles'),
('Limpieza', 'Productos de limpieza para el hogar'),
('Carnes', 'Carnes frescas y procesadas'),
('Verduras', 'Verduras y hortalizas frescas'),
('Frutas', 'Frutas frescas de temporada'),
('Dulces', 'Dulces y golosinas'),
('Botanas', 'Botanas y snacks');

-- Insertar productos de ejemplo
INSERT INTO public.products (name, description, cost_price, selling_price, sku, is_active, is_weighted, measurement_unit) VALUES
-- Lácteos
('Leche Entera 1L', 'Leche entera pasteurizada de 1 litro', 12.00, 18.00, 'LCH001', true, false, 'un'),
('Yogurt Natural 500g', 'Yogurt natural sin azúcar de 500g', 8.00, 12.00, 'YGT001', true, false, 'un'),
('Queso Panela 500g', 'Queso panela fresco de 500g', 30.00, 45.00, 'QSP001', true, false, 'un'),
('Queso Manchego 1kg', 'Queso manchego artesanal por kilo', 150.00, 180.00, 'QSM001', true, true, 'kg'),

-- Panadería
('Bolillo Blanco', 'Bolillo blanco tradicional', 1.50, 2.50, 'BLL001', true, false, 'un'),
('Pan Integral 6pzas', 'Pan integral de 6 piezas', 15.00, 25.00, 'PIN001', true, false, 'un'),
('Conchas', 'Conchas dulces recién horneadas', 2.00, 4.00, 'CCH001', true, false, 'un'),

-- Bebidas
('Coca Cola 600ml', 'Refresco Coca Cola 600ml', 8.00, 12.00, 'COC001', true, false, 'un'),
('Jugo de Naranja 1L', 'Jugo de naranja natural de 1 litro', 15.00, 25.00, 'JNG001', true, false, 'un'),
('Agua Purificada 500ml', 'Agua purificada en botella de 500ml', 5.00, 8.00, 'AGU001', true, false, 'un'),

-- Abarrotes
('Arroz Extra 1kg', 'Arroz tipo extra de 1 kilogramo', 15.00, 22.00, 'ARR001', true, false, 'un'),
('Frijol Bayo 1kg', 'Frijol bayo seleccionado de 1 kilogramo', 20.00, 30.00, 'FRJ001', true, false, 'un'),
('Azúcar Blanca 1kg', 'Azúcar blanca refinada de 1 kilogramo', 12.00, 18.00, 'AZC001', true, false, 'un'),
('Aceite Vegetal 1L', 'Aceite vegetal puro de 1 litro', 25.00, 35.00, 'ACV001', true, false, 'un'),

-- Limpieza
('Jabón en Polvo 1kg', 'Jabón en polvo para ropa de 1 kilogramo', 20.00, 28.00, 'JBP001', true, false, 'un'),
('Cloro 1L', 'Cloro para limpieza de 1 litro', 15.00, 22.00, 'CLRO01', true, false, 'un'),
('Papel Sanitario', 'Rollo de papel sanitario', 8.00, 12.00, 'PPS001', true, false, 'un'),

-- Carnes
('Pechuga Pollo 1kg', 'Pechuga de pollo fresca por kilo', 60.00, 80.00, 'PCH001', true, true, 'kg'),
('Bistec Res 1kg', 'Bistec de res seleccionado por kilo', 120.00, 160.00, 'BST001', true, true, 'kg'),
('Molida Res 1kg', 'Carne molida de res por kilo', 90.00, 120.00, 'MLD001', true, true, 'kg'),

-- Verduras y Frutas
('Tomate Rojo', 'Tomate rojo fresco', 8.00, 12.00, 'TMT001', true, true, 'kg'),
('Cebolla Blanca', 'Cebolla blanca fresca', 6.00, 10.00, 'CBL001', true, true, 'kg'),
('Plátano', 'Plátano tabasco fresco', 8.00, 12.00, 'PLT001', true, true, 'kg'),
('Manzana Roja', 'Manzana roja importada', 25.00, 35.00, 'MNZ001', true, true, 'kg'),

-- Dulces y Botanas
('Dulces Mezcla 500g', 'Mezcla de dulces surtidos de 500g', 15.00, 25.00, 'DLC001', true, false, 'un'),
('Papas Fritas', 'Papas fritas sabor original', 10.00, 15.00, 'PPS002', true, false, 'un'),
('Chicles 5pzas', 'Chicles sabor frutal de 5 piezas', 5.00, 8.00, 'CHC001', true, false, 'un');

-- Insertar inventario inicial para los productos en la bodega central
-- Primero necesitamos obtener los IDs de las tiendas
-- Suponiendo que la tienda central tiene ID conocido o es la primera
-- Vamos a insertar inventario inicial para algunos productos en la tienda central (y posiblemente en otras)

-- Insertar tiendas si no existen (bodega central y al menos una sucursal)
INSERT INTO public.stores (name, address, type) 
SELECT 'Bodega Central', 'Almacén Principal', 'central'
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE type = 'central' LIMIT 1);

INSERT INTO public.stores (name, address, type) 
SELECT 'Sucursal 1', 'Calle Principal #123', 'branch'
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE name = 'Sucursal 1' LIMIT 1);

-- Obtener IDs de las tiendas recién insertadas o existentes
-- Insertar inventario inicial
INSERT INTO public.inventory (store_id, product_id, stock)
SELECT 
    s.id as store_id,
    p.id as product_id,
    CASE 
        WHEN p.selling_price < 20 THEN 100  -- Productos baratos, más inventario
        WHEN p.selling_price < 50 THEN 50
        WHEN p.selling_price < 100 THEN 25
        ELSE 10
    END as stock
FROM public.products p
CROSS JOIN (SELECT id FROM public.stores WHERE type = 'central' LIMIT 1) s
WHERE p.is_active = true;

-- Insertar inventario para la sucursal también
INSERT INTO public.inventory (store_id, product_id, stock)
SELECT 
    st.id as store_id,
    p.id as product_id,
    CASE 
        WHEN p.selling_price < 20 THEN 50   -- Productos baratos, más inventario
        WHEN p.selling_price < 50 THEN 25
        WHEN p.selling_price < 100 THEN 10
        ELSE 5
    END as stock
FROM public.products p
CROSS JOIN (SELECT id FROM public.stores WHERE name = 'Sucursal 1' LIMIT 1) st
WHERE p.is_active = true;