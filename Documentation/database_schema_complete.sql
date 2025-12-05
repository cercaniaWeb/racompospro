-- Primero, crear todas las tablas

-- Tabla de Perfiles de Usuarios (para complementar Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY, -- Referencia al ID de auth.users
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cajera', -- posibles valores: 'cajera', 'gerente', 'admin', 'dev'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- posibles valores: 'active', 'inactive', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tiendas
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'branch', -- posibles valores: 'central', 'branch'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- posibles valores: 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Asociación Usuario-Tienda
CREATE TABLE IF NOT EXISTS user_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Tabla de Categorías de Productos
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Precio de venta
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Costo
    sku VARCHAR(100) UNIQUE, -- Stock Keeping Unit
    barcode VARCHAR(100) UNIQUE, -- Código de barras
    category_id UUID REFERENCES categories(id),
    min_stock INTEGER NOT NULL DEFAULT 0, -- Stock mínimo antes de alerta
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Inventario (por tienda)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0, -- Cantidad disponible
    reserved INTEGER NOT NULL DEFAULT 0, -- Cantidad reservada (no disponible para venta)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, store_id) -- Un producto no puede estar más de una vez en la misma tienda
);

-- Tabla de Ventas
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Aunque se menciona que no hay impuestos, se incluye para flexibilidad
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- posibles valores: 'completed', 'pending', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ítems de Ventas
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, -- Precio unitario al momento de la venta
    total_price DECIMAL(12, 2) NOT NULL, -- Precio total (unit_price * quantity)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Transferencias de Inventario
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    to_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- posibles valores: 'draft', 'approved', 'in_transit', 'received', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Ítems de Transferencia
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes (opcional)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices después de crear las tablas
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_inventory_store_product ON inventory(store_id, product_id);

-- Función para actualizar automáticamente la columna 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar 'updated_at' automáticamente
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_stores_updated_at 
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_inventory_updated_at 
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_sales_updated_at 
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para manejar automáticamente la creación de perfiles de usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear automáticamente un perfil cuando un usuario se registra
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Activar RLS (esto debe hacerse DESPUÉS de crear las tablas)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON user_profiles
FOR ALL USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Users can view stores they belong to" ON stores
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE user_stores.store_id = stores.id 
        AND user_stores.user_id = auth.uid()
    )
    OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Products are viewable by authenticated users" ON products
FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view inventory for stores they belong to" ON inventory
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE user_stores.store_id = inventory.store_id 
        AND user_stores.user_id = auth.uid()
    )
    OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Users can view sales for stores they belong to" ON sales
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE user_stores.store_id = sales.store_id 
        AND user_stores.user_id = auth.uid()
    )
    OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Users can view sale items for sales in stores they belong to" ON sale_items
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM sales 
        JOIN user_stores ON user_stores.store_id = sales.store_id
        WHERE sales.id = sale_items.sale_id
        AND user_stores.user_id = auth.uid()
    )
    OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

CREATE POLICY "Users can view transfers for stores they belong to" ON inventory_transfers
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_stores 
        WHERE (user_stores.store_id = inventory_transfers.from_store_id 
               OR user_stores.store_id = inventory_transfers.to_store_id)
        AND user_stores.user_id = auth.uid()
    )
    OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- Insertar datos iniciales de ejemplo (solo si no existen)
INSERT INTO stores (name, address, type) 
SELECT 'Bodega Central', 'Calle Principal #123, Ciudad', 'central'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Bodega Central');

INSERT INTO stores (name, address, type) 
SELECT 'Tienda 1', 'Avenida Secundaria #456, Ciudad', 'branch'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Tienda 1');

INSERT INTO stores (name, address, type) 
SELECT 'Tienda 2', 'Calle Terciaria #789, Ciudad', 'branch'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Tienda 2');

INSERT INTO categories (name, description) 
SELECT 'Lácteos', 'Productos lácteos como leche, queso, yogur'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lácteos');

INSERT INTO categories (name, description) 
SELECT 'Panadería', 'Pan, bolillos, pasteles y otros productos horneados'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Panadería');

INSERT INTO categories (name, description) 
SELECT 'Bebidas', 'Refrescos, jugos, agua embotellada'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bebidas');

INSERT INTO categories (name, description) 
SELECT 'Abarrotes', 'Productos de despensa como arroz, azúcar, frijoles'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Abarrotes');

INSERT INTO categories (name, description) 
SELECT 'Limpieza', 'Productos de limpieza para el hogar'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Limpieza');