-- MIGRACIÓN A ESQUEMA DOCUMENTADO
-- Ejecutar en: https://supabase.com/dashboard/project/gdkpwsgcqwvsxghvoqmu/sql

-- ========================================
-- PASO 1: Guardar datos actuales
-- ========================================

-- Crear tabla temporal para guardar asignaciones de usuarios-tiendas
CREATE TEMP TABLE temp_user_stores AS
SELECT id as user_id, store_id 
FROM users 
WHERE store_id IS NOT NULL;

-- ========================================
-- PASO 2: Renombrar y actualizar users
-- ========================================

-- Renombrar tabla
ALTER TABLE users RENAME TO user_profiles;

-- Eliminar store_id (ya guardamos los datos)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS store_id;

-- ========================================
-- PASO 3: Crear tabla user_stores
-- ========================================

CREATE TABLE IF NOT EXISTS user_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Migrar datos guardados
INSERT INTO user_stores (user_id, store_id)
SELECT user_id, store_id FROM temp_user_stores
ON CONFLICT (user_id, store_id) DO NOTHING;

-- ========================================
-- PASO 4: Agregar reserved a inventory
-- ========================================

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER NOT NULL DEFAULT 0;

-- ========================================
-- PASO 5: Crear tabla categories
-- ========================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PASO 6: Agregar category_id a products
-- ========================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- ========================================
-- PASO 7: Insertar categorías iniciales
-- ========================================

INSERT INTO categories (name, description) VALUES
('Lácteos', 'Productos lácteos como leche, queso, yogur'),
('Panadería', 'Pan, bolillos, pasteles y otros productos horneados'),
('Bebidas', 'Refrescos, jugos, agua embotellada'),
('Abarrotes', 'Productos de despensa como arroz, azúcar, frijoles'),
('Limpieza', 'Productos de limpieza para el hogar')
ON CONFLICT DO NOTHING;

-- ========================================
-- PASO 8: Habilitar RLS en nuevas tablas
-- ========================================

ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 9: Políticas RLS para user_stores
-- ========================================

CREATE POLICY "Users can view their own store assignments"
ON user_stores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage store assignments"
ON user_stores FOR ALL
USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- ========================================
-- PASO 10: Políticas RLS para categories
-- ========================================

CREATE POLICY "Anyone can read categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- ========================================
-- PASO 11: Actualizar función sync_user_from_auth
-- ========================================

CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
RETURNS void AS $$
DECLARE
  auth_user_id uuid;
  auth_email text;
  user_metadata jsonb;
BEGIN
  auth_user_id := auth.uid();
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT 
    au.email,
    au.raw_user_meta_data
  INTO 
    auth_email,
    user_metadata
  FROM auth.users au
  WHERE au.id = auth_user_id;

  -- Insertar/actualizar en user_profiles
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    auth_user_id,
    auth_email,
    COALESCE(user_metadata->>'name', auth_email),
    COALESCE(user_metadata->>'role', 'cajera'),
    COALESCE(user_metadata->>'status', 'active'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.user_profiles.name),
    updated_at = NOW();

  -- Si hay store_id en metadata, crear asignación
  IF user_metadata->>'store_id' IS NOT NULL THEN
    INSERT INTO public.user_stores (user_id, store_id)
    VALUES (auth_user_id, (user_metadata->>'store_id')::uuid)
    ON CONFLICT (user_id, store_id) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar migración de datos
SELECT 
    'user_profiles' as tabla,
    COUNT(*) as registros
FROM user_profiles
UNION ALL
SELECT 
    'user_stores' as tabla,
    COUNT(*) as registros
FROM user_stores
UNION ALL
SELECT 
    'categories' as tabla,
    COUNT(*) as registros
FROM categories;
