import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase/client';

export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Syncs offline data to Supabase with granular handling for multi-store architecture
 * - Products: Global catalog updates (admin only)
 * - Inventory: Per-store pricing, stock, and availability
 * - Sales: Store-specific transactions
 */
export const syncOfflineData = async (): Promise<void> => {
  if (!isOnline()) return;

  console.log('Syncing offline data...');

  try {
    const pendingGroups = await db.getPendingSyncRecords();

    for (const group of pendingGroups) {
      const { table, records } = group;
      const recordIds = records.map(r => r.id);

      if (records.length === 0) continue;

      // Prepare records based on table type
      const recordsToSync = records.map(record => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, sync_status, last_modified, ...rest } = record;

        let mappedRecord: any = { ...rest };

        // Handle table-specific mappings
        switch (table) {
          case 'products':
            // Global product updates (admin-level changes)
            mappedRecord = {
              sku: record.sku,
              name: record.name,
              description: record.description,
              selling_price: record.price || record.selling_price,
              cost_price: record.cost || record.cost_price || 0,
              barcode: record.barcode,
              barcode_prefix: record.barcode_prefix,
              category_id: record.category_id,
              is_active: record.is_active ?? true,
              is_weighted: record.is_weighted ?? false,
              measurement_unit: record.measurement_unit || 'unit',
              image_url: record.image_url,
            };
            break;

          case 'inventory':
            // Per-store inventory updates (stock, pricing, availability)
            mappedRecord = {
              product_id: record.product_id,
              store_id: record.store_id,
              stock: record.stock ?? record.quantity ?? 0,
              reserved: record.reserved,
              custom_selling_price: record.custom_selling_price,
              custom_cost_price: record.custom_cost_price,
              is_active: record.is_active ?? true,
              min_stock: record.min_stock ?? 0,
              max_stock: record.max_stock,
            };
            break;

          case 'sales':
            // Store-specific sales
            mappedRecord = {
              store_id: record.store_id,
              transaction_id: record.transaction_id,
              customer_id: record.customer_id,
              total_amount: record.total_amount,
              status: record.status || 'completed',
              sale_date: record.created_at || new Date().toISOString(),
              processed_by: record.processed_by,
              cash_session_id: record.cash_session_id,
            };
            break;

          case 'saleItems':
            // Sale items
            mappedRecord = {
              sale_id: record.sale_id,
              product_id: record.product_id,
              quantity: record.quantity,
              unit_price: record.unit_price,
              total_price: record.total_price,
              batch_id: record.batch_id,
            };
            break;

          default:
            // For other tables, use the record as-is (minus local fields)
            mappedRecord = { ...rest };
        }

        // Preserve created_at for audit trail
        if (record.created_at) {
          mappedRecord.created_at = record.created_at;
        }

        return mappedRecord;
      });

      // Sync to Supabase
      const { error } = await supabase
        .from(table)
        .upsert(recordsToSync, {
          onConflict: table === 'inventory' ? 'product_id,store_id' : undefined
        });

      if (error) {
        console.error(`Failed to sync table ${table}:`, error);
        // Don't mark as synced if there was an error
      } else {
        console.log(`Successfully synced ${records.length} records from ${table}`);
        await db.markAsSynced(table, recordIds);
      }
    }

    console.log('Sync completed');
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

/**
 * Initialize online/offline detection and auto-sync
 */
export const initOnlineDetection = (): void => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('Device is online. Starting sync...');
      syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('Device is offline. Changes will be saved locally.');
    });

    // Initial sync if online
    if (isOnline()) {
      syncOfflineData();
    }
  }
};