import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number | string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id?: number;
  supplier_id?: number;
  stock_quantity: number;
  stock_current?: number;  // Alias for compatibility
  min_stock_level?: number;
  min_stock?: number;  // Alias for compatibility
  barcode?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
  is_taxable: boolean;
  is_weighted?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
  image_url?: string;
}

// Interface for the alternative terminal implementation in modificaciones directory
export interface ProductLocal {
  id?: number | string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id?: number;
  supplier_id?: number;
  stock_quantity: number;
  min_stock_level?: number;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
  is_taxable: boolean;
  is_weighted?: boolean; // Added for the alternative terminal
  created_at?: Date;
  updated_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
  image_url?: string;
}

export interface CartItem {
  product_id: number | string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  is_weighted?: boolean;
}

export interface Sale {
  id?: number | string;
  transaction_id: string;
  customer_id?: number;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  commission_amount?: number;
  amount_paid?: number;
  change_amount?: number;
  net_amount: number;
  payment_method: string;
  status: 'completed' | 'voided' | 'pending';
  notes?: string; // Comentarios/notas del cajero
  created_at: Date;
  updated_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface SaleItem {
  id?: number;
  sale_id: number | string;
  product_id: number | string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_amount?: number;
  discount_amount?: number;
  created_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface Customer {
  id?: number;
  external_id?: string; // ID from Supabase
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface ConsumptionItem {
  product_id: number | string;
  quantity: number;
  cost_at_moment: number;
}

export interface TransferItem {
  product_id: number | string;
  name: string;
  qty_requested: number;
  qty_approved?: number;
  qty_shipped?: number;
  qty_received?: number;
  current_stock?: number; // Helper for UI
}

export interface Transfer {
  id?: number | string;
  origin_store_id: string;
  dest_store_id: string;
  items: TransferItem[];
  status: 'requested' | 'approved' | 'shipped' | 'received' | 'cancelled';
  requested_by?: string;
  approved_by?: string;
  received_by?: string;
  created_at: Date;
  shipped_at?: Date;
  received_at?: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
  notes?: string;
}

export interface Consumption {
  id?: number;
  employee_id: string;
  items: ConsumptionItem[];
  total_cost: number;
  authorized_by?: string;
  status: 'pending_upload' | 'synced';
  created_at: Date;
  last_modified?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  estimated_cost?: number;
  is_purchased: boolean;
}

export interface ShoppingList {
  id?: number;
  name: string;
  items: ShoppingListItem[];
  status: 'active' | 'completed' | 'archived';
  created_at: Date;
  updated_at?: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  category: string; // e.g., 'inventory', 'utilities', 'maintenance'
  date: Date;
  payment_method: string;
  receipt_image?: string; // Base64 or URL
  shopping_list_id?: number; // Optional link to a shopping list
  created_at: Date;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface SyncLog {
  id?: number;
  table_name: string;
  record_id: number;
  operation: 'insert' | 'update' | 'delete';
  status: 'pending' | 'synced' | 'failed';
  created_at: Date;
  synced_at?: Date;
}

export class PosDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  categories!: Table<Category>;
  customers!: Table<Customer>;
  consumptions!: Table<Consumption>;
  transfers!: Table<Transfer>;
  shoppingLists!: Table<ShoppingList>;
  expenses!: Table<Expense>;
  syncLog!: Table<SyncLog>;

  constructor() {
    super('PosDatabase');
    this.version(6).stores({  // Updated to version 6 for barcode index
      products: '++id, sku, name, barcode, category_id, is_active, last_modified, sync_status',
      sales: '++id, transaction_id, customer_id, status, created_at, last_modified, sync_status',
      saleItems: '++id, sale_id, product_id, product_sku, created_at, last_modified, sync_status',
      categories: '++id, name, parent_id, is_active, last_modified, sync_status',
      customers: '++id, external_id, name, email, is_active, last_modified, sync_status',
      consumptions: '++id, employee_id, status, created_at, last_modified, sync_status',
      transfers: '++id, origin_store_id, dest_store_id, status, created_at, last_modified, sync_status',
      shoppingLists: '++id, name, status, created_at, sync_status',
      expenses: '++id, category, date, created_at, sync_status',
      syncLog: '++id, table_name, record_id, operation, status, created_at',
    });
  }

  // Method to get all pending sync records
  async getPendingSyncRecords(): Promise<Array<{ table: string, records: any[] }>> {
    const result = [];

    // Get pending sync records from each table
    const pendingProducts = await this.products.where('sync_status').equals('pending').toArray();
    if (pendingProducts.length > 0) {
      result.push({ table: 'products', records: pendingProducts });
    }

    const pendingSales = await this.sales.where('sync_status').equals('pending').toArray();
    if (pendingSales.length > 0) {
      result.push({ table: 'sales', records: pendingSales });
    }

    const pendingSaleItems = await this.saleItems.where('sync_status').equals('pending').toArray();
    if (pendingSaleItems.length > 0) {
      result.push({ table: 'sale_items', records: pendingSaleItems });
    }

    const pendingCategories = await this.categories.where('sync_status').equals('pending').toArray();
    if (pendingCategories.length > 0) {
      result.push({ table: 'categories', records: pendingCategories });
    }

    const pendingCustomers = await this.customers.where('sync_status').equals('pending').toArray();
    if (pendingCustomers.length > 0) {
      result.push({ table: 'customers', records: pendingCustomers });
    }

    // Include pending consumptions
    const pendingConsumptions = await this.consumptions.where('sync_status').equals('pending').toArray();
    if (pendingConsumptions.length > 0) {
      result.push({ table: 'consumptions', records: pendingConsumptions });
    }

    // Include pending transfers
    const pendingTransfers = await this.transfers.where('sync_status').equals('pending').toArray();
    if (pendingTransfers.length > 0) {
      result.push({ table: 'transfers', records: pendingTransfers });
    }

    // Include pending shopping lists
    const pendingShoppingLists = await this.shoppingLists.where('sync_status').equals('pending').toArray();
    if (pendingShoppingLists.length > 0) {
      result.push({ table: 'shopping_lists', records: pendingShoppingLists });
    }

    // Include pending expenses
    const pendingExpenses = await this.expenses.where('sync_status').equals('pending').toArray();
    if (pendingExpenses.length > 0) {
      result.push({ table: 'expenses', records: pendingExpenses });
    }

    return result;
  }

  // Method to mark records as synced
  async markAsSynced(tableName: string, recordIds: number[]): Promise<void> {
    if (recordIds.length === 0) return;

    switch (tableName) {
      case 'products':
        await this.products
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'sales':
        await this.sales
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'sale_items':
        await this.saleItems
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'categories':
        await this.categories
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'customers':
        await this.customers
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'consumptions':
        await this.consumptions
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'transfers':
        await this.transfers
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', last_modified: new Date() });
        break;
      case 'shopping_lists':
        await this.shoppingLists
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced', updated_at: new Date() });
        break;
      case 'expenses':
        await this.expenses
          .where('id')
          .anyOf(recordIds)
          .modify({ sync_status: 'synced' });
        break;
    }
  }

  // Method to add a sync log entry
  async logSyncOperation(
    tableName: string,
    recordId: number,
    operation: 'insert' | 'update' | 'delete'
  ): Promise<number> {
    return await this.syncLog.add({
      table_name: tableName,
      record_id: recordId,
      operation,
      status: 'pending',
      created_at: new Date()
    });
  }

  // Method to update sync status
  async updateSyncStatus(logId: number, status: 'synced' | 'failed'): Promise<void> {
    await this.syncLog.update(logId, {
      status,
      synced_at: status === 'synced' ? new Date() : undefined
    });
  }
}

export const db = new PosDatabase();