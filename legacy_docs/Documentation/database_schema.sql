-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cajera', -- posibles valores: 'cajera', 'gerente', 'admin', 'dev'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- posibles valores: 'active', 'inactive', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX idx_users_email ON users(email);

-- Tabla de Tiendas
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'branch', -- posibles valores: 'central', 'branch'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- posibles valores: 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Asociación Usuario-Tienda (un usuario puede pertenecer a múltiples tiendas)
CREATE TABLE user_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Tabla de Categorías de Productos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE products (
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

-- Índices para búsquedas rápidas
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);

-- Tabla de Inventario (por tienda)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0, -- Cantidad disponible
    reserved INTEGER NOT NULL DEFAULT 0, -- Cantidad reservada (no disponible para venta)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, store_id) -- Un producto no puede estar más de una vez en la misma tienda
);

-- Índice para búsquedas por tienda y producto
CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);

-- Tabla de Ventas
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Aunque se menciona que no hay impuestos, se incluye para flexibilidad
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- posibles valores: 'completed', 'pending', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ítems de Ventas
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, -- Precio unitario al momento de la venta
    total_price DECIMAL(12, 2) NOT NULL, -- Precio total (unit_price * quantity)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Transferencias de Inventario
CREATE TABLE inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    to_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- posibles valores: 'draft', 'approved', 'in_transit', 'received', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Ítems de Transferencia
CREATE TABLE inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes (opcional, si se desea manejar clientes)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Políticas para seguridad
-- Estas políticas deben ajustarse según los requisitos de seguridad

-- Política para usuarios
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are viewable by same user or admins" ON users
FOR SELECT USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- Política para productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by authenticated users" ON products
FOR ALL USING (auth.role() = 'authenticated');

-- Política para inventario
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory is viewable by authenticated users" ON inventory
FOR ALL USING (auth.role() = 'authenticated');

-- Función para actualizar la columna 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Gatillos para actualizar 'updated_at' automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales de ejemplo

-- Insertar tiendas
INSERT INTO stores (name, address, type) VALUES
('Bodega Central', 'Calle Principal #123, Ciudad', 'central'),
('Tienda 1', 'Avenida Secundaria #456, Ciudad', 'branch'),
('Tienda 2', 'Calle Terciaria #789, Ciudad', 'branch');

-- Insertar categorías
INSERT INTO categories (name, description) VALUES
('Lácteos', 'Productos lácteos como leche, queso, yogur'),
('Panadería', 'Pan, bolillos, pasteles y otros productos horneados'),
('Bebidas', 'Refrescos, jugos, agua embotellada'),
('Abarrotes', 'Productos de despensa como arroz, azúcar, frijoles'),
('Limpieza', 'Productos de limpieza para el hogar');

-- Insertar un usuario administrador de ejemplo
-- NOTA: En la práctica, los usuarios se crean a través de Supabase Auth, pero podemos insertar registros correspondientes
-- para los usuarios que ya existen en Supabase Auth
-- INSERT INTO users (id, email, name, role) VALUES
-- (auth.uid(), 'admin@recoompos.com', 'Administrador Principal', 'admin');
-- ^ Esto se haría en una función de base de datos desencadenada por Supabase Auth