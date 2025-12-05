// ========================================
// USER & AUTH

// AUTHENTICATION TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gerente' | 'cajera' | 'dev' | 'staff';
  status: 'active' | 'inactive' | 'pending';
  imageUrl?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStore {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
}

// ========================================
// STORE TYPES
// ========================================

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  type: 'central' | 'branch';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// PRODUCT & INVENTORY TYPES
// ========================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // Database field
  selling_price?: number; // Alias for price
  cost: number; // Database field
  cost_price?: number; // Alias for cost (backward compatibility)
  sku: string;
  barcode?: string;
  min_stock: number;
  stock?: number; // Local stock (not in DB, computed)
  category?: string;
  category_id?: string;
  image_url?: string;
  is_active?: boolean; // Not in DB schema
  is_weighted?: boolean; // Not in DB schema
  measurement_unit?: string; // Not in DB schema
  is_batch_tracked?: boolean; // Added by migration
  created_at?: string;
  updated_at?: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  cost_override?: number;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  store_id: string;
  stock: number;
  reserved?: number;
  // Per-store pricing (if null, falls back to product table values)
  custom_selling_price?: number;
  custom_cost_price?: number;
  is_active: boolean;
  min_stock: number;
  max_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryBatchLevel {
  id: string;
  store_id: string;
  batch_id: string;
  quantity: number;
  location_in_store?: string;
  updated_at: string;
}

// ========================================
// SALES TYPES
// ========================================

export interface Sale {
  id: string;
  store_id: string;
  customer_id?: string;
  sale_date: string;
  total_amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  processed_by?: string;
  cash_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_id?: string;
  created_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: 'cash' | 'card' | 'transfer';
  amount: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// CASH MANAGEMENT TYPES
// ========================================

export interface CashSession {
  id: string;
  store_id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  closed_by_user_id?: string;
  opening_balance: number;
  theoretical_balance?: number;
  closing_balance?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashMovement {
  id: string;
  cash_session_id: string;
  type: 'income' | 'expense' | 'adjustment';
  amount: number;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface CardWithdrawal {
  id: string;
  cash_session_id: string;
  requested_amount: number;
  charged_amount: number;
  commission: number;
  given_cash: number;
  processed_by: string;
  processed_at: string;
  notes?: string;
}

// ========================================
// TRANSFER TYPES
// ========================================

export interface Transfer {
  id: string;
  origin_store_id: string;
  destination_store_id: string;
  requested_by?: string;
  approved_by?: string;
  received_by?: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  created_at: string;
  shipped_at?: string;
  received_at?: string;
  notes?: string;
}

export interface TransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  qty_requested: number;
  qty_approved?: number;
  qty_shipped?: number;
  qty_received?: number;
}

export interface InventoryTransfer {
  id: string;
  from_store_id: string;
  to_store_id: string;
  status: 'draft' | 'approved' | 'in_transit' | 'received' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  batch_id?: string;
  created_at: string;
}

// ========================================
// EMPLOYEE TYPES
// ========================================

export interface EmployeeConsumption {
  id: string;
  store_id: string;
  employee_id: string;
  authorized_by?: string;
  total_cost: number;
  created_at: string;
  synced_at: string;
}

export interface EmployeeConsumptionItem {
  id: string;
  consumption_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
}

// ========================================
// SUPABASE DATABASE TYPE
// ========================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Store, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id'>>;
      };
      inventory: {
        Row: Inventory;
        Insert: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Inventory, 'id'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Sale, 'id'>>;
      };
      cash_sessions: {
        Row: CashSession;
        Insert: Omit<CashSession, 'id' | 'opened_at'>;
        Update: Partial<Omit<CashSession, 'id'>>;
      };
      transfers: {
        Row: Transfer;
        Insert: Omit<Transfer, 'id' | 'created_at'>;
        Update: Partial<Omit<Transfer, 'id'>>;
      };
    };
  };
}