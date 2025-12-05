-- =====================================================
-- SCRIPT DE SEEDING: USUARIOS DE PRUEBA PARA CADA ROL
-- =====================================================
-- Este script crea usuarios de prueba para testing del sistema de roles
-- =====================================================

-- IMPORTANTE: Ejecutar DESPUÉS de aplicar las políticas RLS

-- =====================================================
-- 1. CREAR TIENDAS DE PRUEBA
-- =====================================================

INSERT INTO stores (id, name, address, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tienda Central', 'Av. Principal 123', true),
  ('22222222-2222-2222-2222-222222222222', 'Tienda Norte', 'Calle Norte 456', true),
  ('33333333-3333-3333-3333-333333333333', 'Tienda Sur', 'Av. Sur 789', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREAR USUARIOS EN AUTH (Supabase Auth)
-- =====================================================
-- NOTA: Estos usuarios deben crearse desde la UI de Supabase o mediante API
-- Aquí solo documentamos las credenciales

/*
USUARIOS A CREAR EN SUPABASE AUTH UI:

1. ADMIN:
   Email: admin@recoom.com
   Password: Admin123!
   Metadata: {}

2. GERENTE TIENDA CENTRAL:
   Email: gerente.central@recoom.com
   Password: Gerente123!
   Metadata: {}

3. GERENTE TIENDA NORTE:
   Email: gerente.norte@recoom.com
   Password: Gerente123!
   Metadata: {}

4. CAJERO TIENDA CENTRAL:
   Email: cajero.central@recoom.com
   Password: Cajero123!
   Metadata: {}

5. CAJERO TIENDA NORTE:
   Email: cajero.norte@recoom.com
   Password: Cajero123!
   Metadata: {}
*/

-- =====================================================
-- 3. INSERTAR DATOS EN TABLA USERS (Después de crear en Auth)
-- =====================================================

-- NOTA: Reemplazar los UUIDs con los IDs reales de auth.users después de crearlos

-- Admin (usar ID real de auth)
INSERT INTO users (id, email, name, role, store_id, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@recoom.com', 'Admin Sistema', 'admin', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- Gerente Tienda Central
INSERT INTO users (id, email, name, role, store_id, is_active) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gerente.central@recoom.com', 'Carlos Gerente', 'grte', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- Gerente Tienda Norte
INSERT INTO users (id, email, name, role, store_id, is_active) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'gerente.norte@recoom.com', 'María Gerente', 'grte', '22222222-2222-2222-2222-222222222222', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- Cajero Tienda Central
INSERT INTO users (id, email, name, role, store_id, is_active) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cajero.central@recoom.com', 'Ana Cajera', 'cajero', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- Cajero Tienda Norte  
INSERT INTO users (id, email, name, role, store_id, is_active) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cajero.norte@recoom.com', 'Luis Cajero', 'cajero', '22222222-2222-2222-2222-222222222222', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- =====================================================
-- 4. PRODUCTOS DE PRUEBA (para verificar visibilidad)
-- =====================================================

INSERT INTO products (sku, name, price, cost, stock_quantity, is_active, is_taxable) VALUES
  ('PROD001', 'Producto Test 1', 10.00, 5.00, 100, true, true),
  ('PROD002', 'Producto Test 2', 15.00, 8.00, 50, true, true),
  ('PROD003', 'Producto Test 3', 20.00, 12.00, 75, true, false)
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- 5. VENTAS DE PRUEBA (para verificar RLS)
-- =====================================================

-- Venta en Tienda Central
INSERT INTO sales (store_id, total_amount, tax_amount, discount_amount, net_amount, payment_method, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 100.00, 15.00, 0.00, 100.00, 'cash', 'completed', NOW())
ON CONFLICT DO NOTHING;

-- Venta en Tienda Norte
INSERT INTO sales (store_id, total_amount, tax_amount, discount_amount, net_amount, payment_method, status, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 150.00, 22.50, 0.00, 150.00, 'card', 'completed', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. TRANSFERENCIAS DE PRUEBA (para verificar RLS)
-- =====================================================

INSERT INTO transfers (origin_store_id, dest_store_id, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'requested', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. VERIFICACIÓN DE POLÍTICAS
-- =====================================================

-- Ejecutar estos queries como cada usuario para verificar RLS:

-- Como Admin (debe ver todas las tiendas):
-- SELECT * FROM stores;

-- Como Gerente Central (debe ver solo Tienda Central):
-- SELECT * FROM sales WHERE store_id = '11111111-1111-1111-1111-111111111111';

-- Como Gerente Norte (NO debe ver ventas de Tienda Central):
-- SELECT * FROM sales WHERE store_id = '11111111-1111-1111-1111-111111111111';
-- Resultado esperado: 0 filas

-- Como Cajero (debe ver solo ventas de su tienda):
-- SELECT * FROM sales;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
/*
1. Crear usuarios en Supabase Auth UI primero
2. Copiar los UUIDs generados
3. Actualizar este script con los UUIDs reales
4. Ejecutar secciones 1, 3, 4, 5, 6
5. Probar con cada usuario en la aplicación
6. Verificar que RLS funciona correctamente
*/
