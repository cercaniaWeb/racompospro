-- =====================================================
-- POLÍTICAS RLS PARA SISTEMA MULTI-TIENDA CON ROLES
-- =====================================================
-- Roles: 'admin', 'grte' (gerente), 'cajero'
-- =====================================================

-- ============================================
-- 1. TABLA: users
-- ============================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todos los usuarios
CREATE POLICY "Admin can view all users"
ON users FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Gerentes solo pueden ver usuarios de su tienda
CREATE POLICY "Gerente can view users from own store"
ON users FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte' 
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Admin puede insertar usuarios en cualquier tienda
CREATE POLICY "Admin can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Gerente solo puede insertar usuarios en su tienda
CREATE POLICY "Gerente can insert users in own store"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Admin puede actualizar cualquier usuario
CREATE POLICY "Admin can update all users"
ON users FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente puede actualizar usuarios de su tienda
CREATE POLICY "Gerente can update users from own store"
ON users FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- ============================================
-- 2. TABLA: products
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todos los productos
CREATE POLICY "Admin can view all products"
ON products FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente y cajero solo pueden ver productos (sin restricción de tienda para productos)
-- Los productos son globales, pero el stock se maneja por tienda
CREATE POLICY "Gerente and Cajero can view products"
ON products FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('grte', 'cajero')
);

-- Solo admin puede insertar/actualizar/eliminar productos
CREATE POLICY "Admin can manage products"
ON products FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- 3. TABLA: sales
-- ============================================

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todas las ventas
CREATE POLICY "Admin can view all sales"
ON sales FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente solo puede ver ventas de su tienda
CREATE POLICY "Gerente can view sales from own store"
ON sales FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Cajero solo puede ver ventas de su tienda (opcional: solo sus propias ventas)
CREATE POLICY "Cajero can view sales from own store"
ON sales FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'cajero'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Cajero y gerente pueden insertar ventas en su tienda
CREATE POLICY "Cajero and Gerente can insert sales in own store"
ON sales FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role' IN ('cajero', 'grte'))
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- ============================================
-- 4. TABLA: transfers
-- ============================================

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todas las transferencias
CREATE POLICY "Admin can view all transfers"
ON transfers FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerentes pueden ver transferencias que involucran su tienda
CREATE POLICY "Gerente can view transfers involving own store"
ON transfers FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND (
    origin_store_id = (auth.jwt() ->> 'store_id')::uuid
    OR dest_store_id = (auth.jwt() ->> 'store_id')::uuid
  )
);

-- Gerentes pueden crear transferencias desde su tienda
CREATE POLICY "Gerente can create transfers from own store"
ON transfers FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'grte'
  AND origin_store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Admin puede aprobar/actualizar transferencias
CREATE POLICY "Admin can update all transfers"
ON transfers FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente puede actualizar transferencias de su tienda
CREATE POLICY "Gerente can update transfers from own store"
ON transfers FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND (
    origin_store_id = (auth.jwt() ->> 'store_id')::uuid
    OR dest_store_id = (auth.jwt() ->> 'store_id')::uuid
  )
);

-- ============================================
-- 5. TABLA: shopping_lists
-- ============================================

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver listas de compras de su tienda
CREATE POLICY "Users can view shopping lists from own store"
ON shopping_lists FOR SELECT
TO authenticated
USING (
  store_id = (auth.jwt() ->> 'store_id')::uuid
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Cajero y gerente pueden crear solicitudes
CREATE POLICY "Cajero and Gerente can create shopping lists"
ON shopping_lists FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role' IN ('cajero', 'grte'))
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
  AND status = 'pending'
);

-- Solo admin puede aprobar listas de compras
CREATE POLICY "Only admin can approve shopping lists"
ON shopping_lists FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR (
    auth.jwt() ->> 'role' = 'grte'
    AND store_id = (auth.jwt() ->> 'store_id')::uuid
  )
);

-- ============================================
-- 6. TABLA: expenses
-- ============================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Admin ve todos los gastos
CREATE POLICY "Admin can view all expenses"
ON expenses FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente ve gastos de su tienda
CREATE POLICY "Gerente can view expenses from own store"
ON expenses FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Gerente puede crear gastos en su tienda
CREATE POLICY "Gerente can create expenses for own store"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- ============================================
-- 7. TABLA: customers
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admin ve todos los clientes
CREATE POLICY "Admin can view all customers"
ON customers FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente y cajero ven clientes de su tienda
CREATE POLICY "Gerente and Cajero can view customers from own store"
ON customers FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('grte', 'cajero')
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- Gerente puede gestionar clientes de su tienda
CREATE POLICY "Gerente can manage customers from own store"
ON customers FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'grte'
  AND store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- ============================================
-- 8. TABLA: consumptions (Consumo de Empleados)
-- ============================================

ALTER TABLE consumptions ENABLE ROW LEVEL SECURITY;

-- Admin ve todos los consumos
CREATE POLICY "Admin can view all consumptions"
ON consumptions FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Gerente ve consumos de su tienda
CREATE POLICY "Gerente can view consumptions from own store"
ON consumptions FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'grte'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = consumptions.employee_id
    AND users.store_id = (auth.jwt() ->> 'store_id')::uuid
  )
);

-- Gerente y cajero pueden crear registros de consumo
CREATE POLICY "Gerente and Cajero can create consumptions"
ON consumptions FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('grte', 'cajero')
);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para verificar si un usuario pertenece a una tienda
CREATE OR REPLACE FUNCTION user_belongs_to_store(user_id uuid, store_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND users.store_id = store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
/*
1. Asegurarse de que auth.jwt() contenga 'role' y 'store_id':
   - Configurar hooks de Supabase Auth para agregar claims personalizados
   - O usar metadata del usuario

2. Para aplicar estas políticas:
   - Ejecutar este script en la consola SQL de Supabase
   - Verificar que las tablas existan antes de ejecutar

3. Probar cada política:
   - Crear usuarios de prueba con diferentes roles
   - Verificar accesos desde la aplicación

4. Auditoría:
   - Considerar agregar tablas de auditoría para cambios críticos
   - Log de accesos a datos sensibles
*/
