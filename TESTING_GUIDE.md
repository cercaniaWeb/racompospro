# Guía de Pruebas - Sistema Multi-Tienda

## 📋 Resumen
Esta guía te llevará paso a paso para probar todas las funcionalidades del sistema multi-tienda implementado.

---

## 🚀 Paso 1: Aplicar Migraciones

### En Supabase Dashboard:

1. Navega a: **SQL Editor**
2. Ejecuta las migraciones en orden:

#### Migración 1: Precios por Tienda
```sql
-- Copiar y ejecutar: supabase/migrations/20251124125543_add_per_store_pricing.sql
```

#### Migración 2: Control de Lotes
```sql
-- Copiar y ejecutar: supabase/migrations/20251124132631_add_batch_tracking.sql
```

✅ **Verificación**: Ambas migraciones deben ejecutarse sin errores.

---

## 🌱 Paso 2: Cargar Datos de Prueba

### En Supabase Dashboard → SQL Editor:

```sql
-- Copiar y ejecutar: supabase/seed_multistore_demo.sql
```

### Datos Creados:

#### 2 Tiendas:
- **Sucursal Centro** (ID: `11111111-1111-1111-1111-111111111111`)
- **Sucursal Aeropuerto** (ID: `22222222-2222-2222-2222-222222222222`)

#### 7 Productos:
| Producto | Precio Global | Centro | Aeropuerto |
|----------|---------------|--------|------------|
| Coca Cola 600ml | $15.00 | $14.00 | $20.00 |
| Agua Mineral 1L | $12.00 | $11.00 | $16.00 |
| Jugo Naranja 1L | $25.00 | $24.00 | $30.00 |
| Papas Fritas | $18.00 | $18.00 | $22.00 |
| Galletas | $22.00 | $22.00 | $26.00 |
| Leche 1L | $20.00 | $19.00 | $24.00 |
| Yogurt 1L | $28.00 | $27.00 | $32.00 |

✅ **Verificación**: Ejecutar query de verificación al final del seed script.

---

## 🌐 Paso 3: Configurar Navegador

### Opción A: Sucursal Centro

1. Abrir consola del navegador (F12)
2. Ejecutar:
```javascript
localStorage.setItem('current_store_id', '11111111-1111-1111-1111-111111111111');
location.reload();
```

### Opción B: Sucursal Aeropuerto

```javascript
localStorage.setItem('current_store_id', '22222222-2222-2222-2222-222222222222');
location.reload();
```

✅ **Verificación**: El dashboard debe mostrar "Operando en: Sucursal Centro" (o Aeropuerto).

---

## 🧪 Pruebas Funcionales

### Test 1: Dashboard con Alertas de Caducidad

**Objetivo**: Verificar que las alertas de productos próximos a vencer se muestran correctamente.

**Pasos**:
1. Navegar a `/dashboard`
2. Observar sección "Alertas de Caducidad"

**Resultado Esperado**:
- ✅ Ver productos con alertas por color:
  - 🔴 **Leche** (LOTE-LE-2024-11A): ~10 días
  - 🟡 **Jugo** (LOTE-JN-2024-10): ~20 días
  - 🔵 **Yogurt** (LOTE-YG-2024-11): ~24 días

---

### Test 2: Vista de Productos por Tienda

**Objetivo**: Verificar que cada tienda solo ve sus productos.

**Pasos**:
1. Navegar a `/products`
2. Observar contador de productos
3. Verificar precios mostrados

**Resultado Esperado (Sucursal Centro)**:
- ✅ Contador: "7 productos"
- ✅ Coca Cola: $14.00 (no $15.00)
- ✅ Agua: $11.00 (no $12.00)

**Resultado Esperado (Sucursal Aeropuerto)**:
- ✅ Contador: "7 productos"
- ✅ Coca Cola: $20.00 (precio premium)
- ✅ Agua: $16.00 (precio premium)

---

### Test 3: Editar Precio Personalizado

**Objetivo**: Cambiar el precio de un producto en una tienda sin afectar otras.

**Pasos**:
1. En `/products` (Sucursal Centro)
2. Click en producto "Coca Cola"
3. Click en botón de editar precio
4. Cambiar precio a $13.50
5. Guardar

**Resultado Esperado**:
- ✅ Precio actualizado en Sucursal Centro: $13.50
- ✅ Precio en Sucursal Aeropuerto: $20.00 (sin cambios)
- ✅ Precio global: $15.00 (sin cambios)

---

### Test 4: Catálogo Maestro (Solo Admin)

**Objetivo**: Verificar que solo admins pueden ver el catálogo global.

**Pasos**:
1. Login como admin
2. Navegar a `/admin/catalog`

**Resultado Esperado**:
- ✅ Ver todos los 7 productos con precios globales
- ✅ Poder crear nuevo producto global
- ✅ Ver columnas: SKU, Precio Global, Costo Global, Estado

---

### Test 5: Agregar Producto a Tienda

**Objetivo**: Agregar un producto del catálogo global al inventario de una tienda.

**Pasos**:
1. Como admin, crear producto "Sprite 600ml" en `/admin/catalog`
   - Precio global: $14.00
   - SKU: BEB-004
2. Como gerente (Sucursal Centro), ir a `/products`
3. Click "Añadir Producto"
4. Buscar "Sprite"
5. Agregar con:
   - Precio personalizado: $13.00
   - Stock inicial: 50

**Resultado Esperado**:
- ✅ Sprite visible en Sucursal Centro con precio $13.00
- ✅ Sprite NO visible en Sucursal Aeropuerto (hasta que lo agreguen)
- ✅ Stock: 50 unidades

---

### Test 6: Realizar Venta en POS

**Objetivo**: Procesar una venta y verificar descuento de stock.

**Pasos**:
1. Navegar a `/pos`
2. Agregar al carrito:
   - 2x Coca Cola
   - 1x Agua Mineral
3. Completar venta

**Resultado Esperado (Sucursal Centro)**:
- ✅ Total: $39.00 (2×$14 + 1×$11)
- ✅ Stock Coca Cola: 48 (era 50)
- ✅ Stock Agua: 79 (era 80)

**Resultado Esperado (Sucursal Aeropuerto)**:
- ✅ Total: $56.00 (2×$20 + 1×$16)
- ✅ Stocks sin cambios (venta en otra tienda)

---

### Test 7: Sincronización Offline

**Objetivo**: Verificar que cambios offline se sincronizan correctamente.

**Pasos**:
1. Desconectar internet (modo avión)
2. Editar precio de "Leche" a $18.00
3. Reconectar internet
4. Esperar auto-sync (ver consola)

**Resultado Esperado**:
- ✅ Consola muestra: "Device is online. Starting sync..."
- ✅ Consola muestra: "Successfully synced X records from inventory"
- ✅ Precio actualizado en Supabase tabla `inventory`
- ✅ Precio global en `products` sin cambios

---

## 📊 Verificaciones en Base de Datos

### Query 1: Ver Inventario por Tienda
```sql
SELECT 
  s.name as tienda,
  p.name as producto,
  i.stock,
  COALESCE(i.custom_selling_price, p.selling_price) as precio_efectivo,
  p.selling_price as precio_global
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
ORDER BY s.name, p.name;
```

### Query 2: Ver Productos Próximos a Vencer
```sql
SELECT * FROM expiring_products 
WHERE store_id = '11111111-1111-1111-1111-111111111111'
ORDER BY days_until_expiry;
```

### Query 3: Verificar Lotes por Tienda
```sql
SELECT 
  s.name as tienda,
  p.name as producto,
  pb.batch_number,
  pb.expiry_date,
  ibl.quantity
FROM inventory_batch_levels ibl
JOIN product_batches pb ON ibl.batch_id = pb.id
JOIN products p ON pb.product_id = p.id
JOIN stores s ON ibl.store_id = s.id
WHERE s.id = '11111111-1111-1111-1111-111111111111'
ORDER BY pb.expiry_date;
```

---

## ✅ Checklist Final

### Funcionalidades Core
- [ ] Dashboard muestra tienda actual
- [ ] Alertas de caducidad visibles y con colores correctos
- [ ] Productos filtrados por tienda
- [ ] Precios personalizados funcionan
- [ ] Catálogo maestro solo para admins
- [ ] Agregar producto a tienda funciona
- [ ] Ventas descuentan stock correcto
- [ ] Sincronización offline funciona

### Datos de Prueba
- [ ] 2 tiendas creadas
- [ ] 7 productos en cada tienda
- [ ] Precios diferentes entre tiendas
- [ ] Lotes con fechas de caducidad
- [ ] Productos críticos visibles en alertas

### UI/UX
- [ ] Nombre de tienda visible en dashboard
- [ ] Contador de productos correcto
- [ ] Colores de urgencia en alertas
- [ ] Modal de edición de precios funcional
- [ ] Navegación entre vistas fluida

---

## 🐛 Troubleshooting

### Problema: No se ven productos
**Solución**: Verificar que `current_store_id` esté configurado en localStorage.

### Problema: Precios no cambian
**Solución**: Verificar que estás editando en la tienda correcta y que el modal se guarda correctamente.

### Problema: Alertas vacías
**Solución**: Verificar que las migraciones se ejecutaron y que existen lotes con fechas de caducidad.

### Problema: Sync no funciona
**Solución**: Verificar consola del navegador para errores. Asegurar que Supabase está configurado correctamente.

---

## 📝 Notas Adicionales

- Los IDs de tiendas son fijos para facilitar pruebas
- En producción, usar IDs reales de Supabase
- Los precios premium del aeropuerto son ~30% más altos
- Los lotes críticos están diseñados para mostrar alertas inmediatas
