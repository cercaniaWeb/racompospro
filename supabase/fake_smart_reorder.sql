-- Workaround: Generate Fake Smart Reorder Suggestions
-- Run this if the Edge Function is not deployed

INSERT INTO reorder_suggestions (
    product_id,
    store_id,
    current_stock,
    daily_sales_rate,
    days_until_depletion,
    suggested_quantity,
    confidence_score,
    estimated_depletion_date,
    priority,
    status,
    ai_reasoning
)
SELECT 
    p.id,
    s.id as store_id,
    FLOOR(RANDOM() * 5)::INTEGER as current_stock,
    (RANDOM() * 5 + 1)::DECIMAL(10,2) as daily_sales_rate,
    FLOOR(RANDOM() * 3 + 1)::INTEGER as days_until_depletion,
    FLOOR(RANDOM() * 20 + 10)::INTEGER as suggested_quantity,
    (RANDOM() * 0.3 + 0.7)::DECIMAL(3,2) as confidence_score,
    NOW() + (INTERVAL '1 day' * FLOOR(RANDOM() * 5)),
    CASE 
        WHEN RANDOM() < 0.3 THEN 'urgent'
        WHEN RANDOM() < 0.6 THEN 'high'
        ELSE 'normal'
    END as priority,
    'pending' as status,
    'Análisis simulado: Stock bajo detectado basado en ventas promedio.' as ai_reasoning
FROM products p
CROSS JOIN stores s
WHERE s.is_active = true
LIMIT 5;

SELECT '✅ 5 Sugerencias simuladas creadas' as message;
