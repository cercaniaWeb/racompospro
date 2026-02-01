-- Verificar la estructura actual de la tabla products
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Verificar si existen los productos que insertamos
SELECT id, name, selling_price, cost_price, sku FROM public.products LIMIT 10;

-- Verificar si hay productos en la tienda actual (suponiendo que la sesión de cajero está asociada a una tienda)
SELECT 
    p.name,
    p.selling_price,
    i.stock
FROM public.products p
JOIN public.inventory i ON p.id = i.product_id
LIMIT 10;