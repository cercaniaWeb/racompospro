# Database Seeder - Guía de Uso

## 📋 Descripción

Este seeder poblará tu base de datos con aproximadamente 1 mes de operaciones realistas para testing completo antes de producción.

## 📊 Datos Generados

### Tiendas (3)
- Tienda Principal (Centro)
- Sucursal Norte
- Bodega Central

### Categorías (8)
- Bebidas
- Snacks
- Lácteos
- Panadería
- Limpieza
- Abarrotes
- Congelados
- Frutas y Verduras

### Productos (50)
Productos realistas mexicanos con:
- SKUs únicos
- Precios de costo y venta
- Proveedores
- Stock mínimo configurado

### Inventario
- 150 registros (50 productos × 3 tiendas)
- Stock inicial aleatorio (20-100 unidades)

### Ventas (~450 ventas)
- Distribuidas en los últimos 30 días
- 10-20 ventas por día
- Métodos de pago variados (efectivo, tarjeta, transferencia)
- Horarios aleatorios realistas

### Items de Venta (~2,000 items)
- 1-5 productos por venta
- Cantidades aleatorias (1-4 unidades)
- Precios históricos reales

## 🚀 Cómo Usar

### Método 1: Supabase Dashboard (Recomendado)

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Ve a tu proyecto
3. Click en **SQL Editor**
4. Click **New Query**
5. Copia y pega el contenido de `supabase/seed.sql`
6. Click **Run** (F5)
7. Espera ~30-60 segundos
8. Verás el resumen al final

### Método 2: CLI de Supabase

```bash
cd /home/lr/work/Proyectos/recoom-pos

# Aplicar seed
supabase db reset --db-url "postgresql://..."

# O directamente con psql
psql "postgresql://..." < supabase/seed.sql
```

### Método 3: Desde tu App

Navega a: `http://localhost:3000/seeder` (si tienes una ruta seeder)

## ⚠️ Consideraciones Importantes

### Antes de Ejecutar

1. **Backup**: Haz backup si tienes datos importantes
   ```sql
   -- Ver datos existentes
   SELECT COUNT(*) FROM sales;
   SELECT COUNT(*) FROM products;
   ```

2. **Modo Limpio**: El script NO borra datos por defecto
   - Para empezar limpio, descomen ta las líneas TRUNCATE al inicio del script

3. **IDs de Tienda**: El script usa IDs específicos
   - Si ya tienes tiendas, ajusta los IDs en el script
   - O comenta la sección de stores

### Datos Generados

- **Ventas totales**: ~$180,000 - $220,000 MXN
- **Productos más vendidos**: Coca-Cola, Sabritas, Pan Bimbo
- **Stock resultante**: 0-80 unidades por producto (después de ventas)

## 🧪 Qué Puedes Probar

### 1. Dashboard
- Ver totales de ventas del mes
- Alertas de productos con bajo stock
- **Smart Reordering**: Debería generar sugerencias

### 2. Reportes
- Filtrar ventas por fecha
- Productos más vendidos
- Usar el Chatbot IA para consultas

### 3. Smart Reordering
Ejecutar análisis manual:
```bash
curl -X POST \
  "$SUPABASE_URL/functions/v1/smart-reorder-analyzer" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

O usar el botón "Analizar" en el dashboard.

### 4. Inventario
- Ver stock actual vs ventas
- Identificar productos que necesitan reorden
- Crear transferencias entre tiendas

### 5. POS
- Crear nuevas ventas
- Ver productos disponibles en cada tienda

## 📈 Resultados Esperados

Después de ejecutar el seeder:

```sql
-- Verificar datos
SELECT 
  (SELECT COUNT(*) FROM stores) as tiendas,
  (SELECT COUNT(*) FROM products) as productos,
  (SELECT COUNT(*) FROM sales) as ventas,
  (SELECT COUNT(*) FROM inventory WHERE stock > 0) as productos_en_stock,
  (SELECT COUNT(*) FROM inventory WHERE stock < 10) as productos_bajo_stock,
  (SELECT SUM(total)::NUMERIC(10,2) FROM sales) as ingresos_totales;
```

Deberías ver aproximadamente:
- **Tiendas**: 3
- **Productos**: 50
- **Ventas**: 400-500
- **Productos en stock**: 100-140
- **Productos bajo stock**: 20-40
- **Ingresos totales**: $180,000 - $220,000

## 🔍 Verificación y Testing

### 1. Ver Productos Más Vendidos
```sql
SELECT 
  p.name,
  SUM(si.quantity) as total_vendido,
  SUM(si.subtotal) as ingresos
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY p.id, p.name
ORDER BY total_vendido DESC
LIMIT 10;
```

### 2. Ver Stock Crítico
```sql
SELECT 
  p.name,
  i.stock,
  p.min_stock,
  s.name as tienda
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN stores s ON s.id = i.store_id
WHERE i.stock < p.min_stock
ORDER BY (p.min_stock - i.stock) DESC;
```

### 3. Ventas por Día
```sql
SELECT 
  DATE(sale_date) as dia,
  COUNT(*) as num_ventas,
  SUM(total)::NUMERIC(10,2) as total_dia
FROM sales
GROUP BY DATE(sale_date)
ORDER BY dia DESC;
```

## 🛠️ Personalización

### Ajustar Cantidad de Ventas

En la sección `daily_sales`, cambia:
```sql
-- Más ventas (20-30 por día)
generate_series(1, FLOOR(20 + RANDOM() * 10)::INTEGER)

-- Menos ventas (5-10 por día)
generate_series(1, FLOOR(5 + RANDOM() * 5)::INTEGER)
```

### Ajustar Rango de Fechas

En la sección `dates`:
```sql
-- Últimos 60 días
SELECT (NOW() - INTERVAL '60 days')::DATE

-- Últimos 7 días
SELECT (NOW() - INTERVAL '7 days')::DATE
```

### Agregar Más Productos

Añade filas en la sección `product_data`:
```sql
('Nombre Producto', 'Categoría', 'SKU', costo, precio, 'descripción', 'proveedor')
```

## 🚨 Troubleshooting

### Error: Duplicate Key
**Problema**: Ya existen datos con los mismos IDs

**Solución**:
1. Comenta la sección de stores si ya tienes tiendas
2. O usa `ON CONFLICT DO NOTHING` (ya incluido)

### Error: Foreign Key Violation
**Problema**: Faltan tablas o relaciones

**Solución**:
1. Ejecuta todas las migraciones primero:
   ```bash
   supabase db push
   ```

### Muy Pocos Datos
**Problema**: El random generó pocas ventas

**Solución**: Ejecuta el script 2-3 veces (los datos se acumularán)

### Mucho Stock
**Problema**: Todos los productos tienen demasiado stock

**Solución**: Ejecuta solo la sección de ventas nuevamente para consumir más inventario

## 📝 Notas Finales

1. **Testing Completo**: Con estos datos podrás probar todas las features
2. **Smart Reordering**: Requiere ejecutar el análisis IA después del seed
3. **Producción**: Limpia estos datos antes de ir a producción
4. **Backup**: Siempre haz backup antes de cambios masivos

---

**Tiempo de ejecución**: ~30-60 segundos  
**Tamaño aprox**: ~500KB de datos  
**Última actualización**: 25 Nov 2024
