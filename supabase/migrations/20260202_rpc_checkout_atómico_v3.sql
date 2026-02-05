-- ========================================================
-- RPC: process_manda2_checkout (VERSIÓN V3 - SCHEMA SYNC)
-- Procesa una venta completa de forma atómica
-- ========================================================

CREATE OR REPLACE FUNCTION public.process_manda2_checkout(
    p_store_id UUID,
    p_customer_name TEXT,
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
    -- 1. Insertar cabecera de la venta
    -- Basado en el esquema real detectado en los reportes:
    -- customer_name en lugar de customer_id, source para identificar origen
    INSERT INTO public.sales (
        store_id,
        customer_name,
        total,
        payment_method,
        source,
        status,
        created_at
    ) VALUES (
        p_store_id,
        p_customer_name,
        p_total_amount,
        p_payment_method,
        'Manda2', -- Identificador de origen
        'completed',
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- 2. Insertar items y actualizar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insertar item de venta
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            price,
            subtotal,
            created_at
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC,
            NOW()
        );

        -- 3. Actualizar tabla de inventario (por sucursal)
        UPDATE public.inventory
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE product_id = (v_item->>'product_id')::UUID
          AND store_id = p_store_id;

        -- 4. Mantener sincronizada la tabla de productos (legacy support)
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

    -- 5. Construir respuesta exitosa
    v_result := jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'message', 'Venta procesada exitosamente en Manda2'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Ante cualquier error, Postgres hace ROLLBACK automático
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;
