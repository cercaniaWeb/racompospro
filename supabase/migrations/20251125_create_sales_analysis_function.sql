-- SQL function to get sales analysis data for Smart Reordering
-- This aggregates sales data with current stock levels

CREATE OR REPLACE FUNCTION get_sales_analysis(p_store_id UUID DEFAULT NULL)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    current_stock INTEGER,
    avg_daily_sales DECIMAL,
    sales_trend TEXT,
    store_id UUID,
    supplier_name TEXT,
    unit_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        COALESCE(inv.stock, 0) AS current_stock,
        COALESCE(
            (
                SELECT AVG(daily_sales)::DECIMAL
                FROM (
                    SELECT DATE(s.created_at) as sale_day, SUM(si.quantity) as daily_sales
                    FROM sales s
                    JOIN sale_items si ON s.id = si.sale_id
                    WHERE si.product_id = p.id
                    AND s.created_at >= NOW() - INTERVAL '30 days'
                    AND (p_store_id IS NULL OR s.store_id = p_store_id)
                    GROUP BY DATE(s.created_at)
                ) daily_totals
            ),
            0
        ) AS avg_daily_sales,
        -- Simple trend calculation: last 7 days vs previous 7 days
        CASE
            WHEN (
                SELECT SUM(si.quantity)
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                WHERE si.product_id = p.id
                AND s.created_at >= NOW() - INTERVAL '7 days'
                AND (p_store_id IS NULL OR s.store_id = p_store_id)
            ) > (
                SELECT SUM(si.quantity)
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                WHERE si.product_id = p.id
                AND s.created_at >= NOW() - INTERVAL '14 days'
                AND s.created_at < NOW() - INTERVAL '7 days'
                AND (p_store_id IS NULL OR s.store_id = p_store_id)
            ) THEN 'increasing'
            WHEN (
                SELECT SUM(si.quantity)
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                WHERE si.product_id = p.id
                AND s.created_at >= NOW() - INTERVAL '7 days'
                AND (p_store_id IS NULL OR s.store_id = p_store_id)
            ) < (
                SELECT SUM(si.quantity)
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                WHERE si.product_id = p.id
                AND s.created_at >= NOW() - INTERVAL '14 days'
                AND s.created_at < NOW() - INTERVAL '7 days'
                AND (p_store_id IS NULL OR s.store_id = p_store_id)
            ) THEN 'decreasing'
            ELSE 'stable'
        END AS sales_trend,
        COALESCE(inv.store_id, p_store_id) AS store_id,
        NULL AS supplier_name,
        p.cost AS unit_cost
    FROM products p
    LEFT JOIN inventory inv ON p.id = inv.product_id
    -- WHERE p.is_active = true
    AND (p_store_id IS NULL OR inv.store_id = p_store_id)
    -- Only include products with sales history or current stock
    AND (
        EXISTS (
            SELECT 1 FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE si.product_id = p.id
            AND s.created_at >= NOW() - INTERVAL '30 days'
            AND (p_store_id IS NULL OR s.store_id = p_store_id)
        )
        OR COALESCE(inv.stock, 0) > 0
    )
    ORDER BY avg_daily_sales DESC NULLS LAST
    LIMIT 100; -- Limit to top 100 products to avoid timeout
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sales_analysis IS 'Aggregates sales data with stock levels for Smart Reordering AI analysis';
