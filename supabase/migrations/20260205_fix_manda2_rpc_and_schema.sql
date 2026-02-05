-- ========================================================
-- SOLUCIÓN DEFINITIVA: checkout_v1
-- Copia y pega este código en el SQL Editor de Supabase
-- ========================================================

-- 1. Borramos rastros de intentos fallidos para limpiar el caché
DROP FUNCTION IF EXISTS public.checkout_v1(jsonb);
DROP FUNCTION IF EXISTS public.manda2_checkout_final(jsonb);
DROP FUNCTION IF EXISTS public.process_manda2_checkout(uuid, text, numeric, text, jsonb, text, text, text);

-- 2. Aseguramos columnas necesarias en la tabla sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'POS';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- 3. Creamos la función flexible que acepta un solo objeto JSON 'p_data'
CREATE OR REPLACE FUNCTION public.checkout_v1(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_total NUMERIC := (p_data->>'p_total_amount')::NUMERIC;
    v_store_id UUID := (p_data->>'p_store_id')::UUID;
BEGIN
    -- Validaciones básicas
    IF v_store_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Falta p_store_id');
    END IF;

    -- Insertar Cabecera de la Venta
    INSERT INTO public.sales (
        store_id, 
        customer_name, 
        total_amount, 
        total, -- Map both names for compatibility
        payment_method, 
        source, 
        fulfillment_status,
        delivery_type,
        delivery_address,
        notes,
        payment_status,
        created_at
    ) VALUES (
        v_store_id,
        p_data->>'p_customer_name',
        v_total,
        v_total,
        p_data->>'p_payment_method',
        'Manda2',
        'pending',
        p_data->>'p_delivery_type',
        p_data->>'p_delivery_address',
        p_data->>'p_notes',
        CASE WHEN p_data->>'p_payment_method' = 'card' THEN 'paid' ELSE 'pending' END,
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- Insertar items y actualizar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_data->'p_items')
    LOOP
        INSERT INTO public.sale_items (sale_id, product_id, quantity, price, subtotal, created_at)
        VALUES (
            v_sale_id, 
            (v_item->>'product_id')::UUID, 
            (v_item->>'quantity')::INTEGER, 
            (v_item->>'unit_price')::NUMERIC, 
            (v_item->>'total_price')::NUMERIC,
            NOW()
        );

        -- Descuento de stock en sucursal
        UPDATE public.inventory 
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE product_id = (v_item->>'product_id')::UUID AND store_id = v_store_id;

        -- Descuento de stock global (si existe la columna stock_quantity)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
            UPDATE public.products 
            SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
                updated_at = NOW()
            WHERE id = (v_item->>'product_id')::UUID;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'sale_id', v_sale_id,
        'message', 'Pedido enviado correctamente a cocina'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- 4. FORZAR RECARGA DEL ESQUEMA (Limpia el error PGRST202 de inmediato)
NOTIFY pgrst, 'reload schema';

SELECT 'Función checkout_v1 instalada correctamente y esquema recargado ✅' as status;
