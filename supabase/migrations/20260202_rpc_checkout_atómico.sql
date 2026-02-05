-- ========================================================
-- RPC: process_manda2_checkout
-- Procesa una venta completa de forma atómica
-- ========================================================

CREATE OR REPLACE FUNCTION public.process_manda2_checkout(
    p_store_id UUID,
    p_customer_id UUID,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_items JSONB,
    p_delivery_location TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_result JSONB;
BEGIN
    -- 1. Iniciar la transacción (automático en funciones de Postgres)
    
    -- 2. Insertar cabecera de la venta
    INSERT INTO public.sales (
        store_id,
        customer_id,
        total_amount,
        payment_method,
        status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        p_store_id,
        p_customer_id,
        p_total_amount,
        p_payment_method,
        'completed',
        CASE WHEN p_delivery_location IS NOT NULL THEN 'Entrega en: ' || p_delivery_location ELSE NULL END,
        NOW(),
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- 3. Insertar items y actualizar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insertar item de venta
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            created_at
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC,
            NOW()
        );

        -- Actualizar tabla de inventario (por sucursal)
        UPDATE public.inventory
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE product_id = (v_item->>'product_id')::UUID
          AND store_id = p_store_id;

        -- Actualizar tabla de productos (denormalizado para sincronización principal)
        -- Solo si existe la columna stock_quantity
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'stock_quantity'
        ) THEN
            UPDATE public.products
            SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
                updated_at = NOW()
            WHERE id = (v_item->>'product_id')::UUID;
        END IF;
    END LOOP;

    -- 4. Construir respuesta
    v_result := jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'message', 'Venta procesada exitosamente'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Ante cualquier error, Postgres hará ROLLBACK automático
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;
