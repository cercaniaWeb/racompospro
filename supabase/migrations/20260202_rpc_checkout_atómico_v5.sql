-- ========================================================
-- RPC: process_manda2_checkout (VERSIÓN V5 - FULL SCHEMA)
-- Procesa una venta completa alineada con el Kitchen Monitor
-- ========================================================

CREATE OR REPLACE FUNCTION public.process_manda2_checkout(
    p_store_id UUID,
    p_customer_name TEXT,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_items JSONB,
    p_delivery_type TEXT,
    p_delivery_address TEXT,
    p_notes TEXT DEFAULT NULL
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
    -- 1. Insertar cabecera de la venta con los campos reales del POS
    INSERT INTO public.sales (
        store_id,
        customer_name,
        total,
        payment_method,
        source,
        fulfillment_status,
        delivery_type,
        delivery_address,
        notes,
        payment_status,
        created_at
    ) VALUES (
        p_store_id,
        p_customer_name,
        p_total_amount,
        p_payment_method,
        'Manda2',
        'pending',
        p_delivery_type,
        p_delivery_address,
        p_notes,
        CASE WHEN p_payment_method = 'card' THEN 'paid' ELSE 'pending' END,
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- 2. Insertar items y actualizar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
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

        -- 3. Actualizar tabla de inventario (sucursal)
        UPDATE public.inventory
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE product_id = (v_item->>'product_id')::UUID
          AND store_id = p_store_id;

        -- 4. Actualizar tabla de productos (global)
        UPDATE public.products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::UUID;
    END LOOP;

    -- 5. Respuesta
    v_result := jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'message', 'Venta enviada a cocina exitosamente'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;
