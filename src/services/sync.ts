import { supabase } from '@/lib/supabase/client';
import { db, Product, Sale } from '@/lib/db';
import { getCurrentStoreId } from '@/hooks/useStoreContext';
import { useNotificationStore } from '@/store/notificationStore';

// Supabase Client (using singleton)

interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
}

/**
 * Estrategia de resolución de conflictos basada en timestamps
 * - Si el registro local es más reciente, prevalece el local
 * - Si el remoto es más reciente, prevalece el remoto
 */
function resolveConflict(localTimestamp: Date, remoteTimestamp: string): 'local' | 'remote' {
  const local = new Date(localTimestamp).getTime();
  const remote = new Date(remoteTimestamp).getTime();
  return local > remote ? 'local' : 'remote';
}

/**
 * Retry con backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Descarga el catálogo completo de productos desde Supabase a Dexie
 * Debe ejecutarse al inicio del turno o mediante botón "Actualizar Catálogo"
 */
export const syncProductsDown = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    errors: []
  };

  try {
    const storeId = getCurrentStoreId();

    // 1. Fetch products desde la nube (Supabase)
    const { data, error } = await retryWithBackoff(async () => {
      return await supabase
        .from('products')
        .select('*');
      // .eq('is_active', true);
    });

    if (error) throw error;

    if (data) {
      // 2. Mapear a formato local
      const productsLocal: Product[] = data.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.selling_price,
        cost: p.cost,
        category_id: p.category_id,
        stock_quantity: p.stock_quantity || 0,
        min_stock_level: p.min_stock_level,
        is_active: true,
        is_taxable: p.is_taxable || false,
        is_weighted: p.is_weighted || false,
        sync_status: 'synced',
        last_modified: new Date(p.updated_at || p.created_at)
      }));

      // 3. Actualizar en Dexie con manejo de conflictos
      await db.transaction('rw', db.products, async () => {
        for (const product of productsLocal) {
          const existing = await db.products.get(product.id!);

          if (existing) {
            // Resolver conflicto si hay cambios locales
            if (existing.sync_status === 'pending') {
              const winner = resolveConflict(
                existing.last_modified || new Date(),
                product.last_modified?.toISOString() || ''
              );

              if (winner === 'remote') {
                await db.products.put({ ...product, sync_status: 'synced' });
              }
              // Si gana local, no hacemos nada
            } else {
              // No hay conflicto, actualizar
              await db.products.put({ ...product, sync_status: 'synced' });
            }
          } else {
            // Producto nuevo
            await db.products.add({ ...product, sync_status: 'synced' });
          }
        }
      });

      result.success = true;
      result.itemsProcessed = productsLocal.length;
      console.log(`✅ Sincronizados ${productsLocal.length} productos.`);

      // Notificación de éxito
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Productos Sincronizados',
        message: `${productsLocal.length} productos actualizados correctamente`
      });
    }
  } catch (err) {
    console.error('❌ Error sincronizando productos:', err);
    result.errors.push(err instanceof Error ? err.message : 'Error desconocido');

    // Notificación de error
    useNotificationStore.getState().addNotification({
      type: 'error',
      title: 'Error en Sincronización de Productos',
      message: err instanceof Error ? err.message : 'Error desconocido',
      autoClose: false
    });
  }

  return result;
};

/**
 * Sube ventas pendientes desde Dexie a Supabase
 * Se ejecuta después de cada venta o en intervalos
 */
export const syncSalesUp = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    errors: []
  };

  try {
    const storeId = getCurrentStoreId();

    // 1. Encontrar ventas locales con estado 'pending'
    const pendingSales = await db.sales
      .where('sync_status')
      .equals('pending')
      .toArray();

    if (pendingSales.length === 0) {
      result.success = true;
      return result;
    }

    console.log(`⬆️ Sincronizando ${pendingSales.length} ventas...`);

    for (const sale of pendingSales) {
      try {
        // 2. Insertar cabecera de venta en Supabase con retry
        const { data: saleData, error: saleError } = await retryWithBackoff(async () => {
          return await supabase
            .from('sales')
            .insert({
              total_amount: sale.total_amount,
              tax_amount: sale.tax_amount,
              discount_amount: sale.discount_amount,
              net_amount: sale.net_amount,
              payment_method: sale.payment_method,
              store_id: storeId,
              status: 'completed',
              created_at: sale.created_at?.toISOString() || new Date().toISOString()
            })
            .select()
            .single();
        });

        if (saleError) throw saleError;

        // 3. Preparar items para inserción en bloque
        const items = await db.saleItems
          .where('sale_id')
          .equals(sale.id!)
          .toArray();

        const saleItemsPayload = items.map(item => ({
          sale_id: saleData.id, // ID generado por Postgres
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        // 4. Insertar detalles de items con retry
        const { error: itemsError } = await retryWithBackoff(async () => {
          return await supabase
            .from('sale_items')
            .insert(saleItemsPayload);
        });

        if (itemsError) throw itemsError;

        // 5. Si tiene éxito, marcar como 'synced' localmente
        await db.sales.update(sale.id!, {
          sync_status: 'synced',
          transaction_id: saleData.id
        });

        await db.saleItems
          .where('sale_id')
          .equals(sale.id!)
          .modify({ sync_status: 'synced' });

        result.itemsProcessed++;
        console.log(`✅ Venta ${sale.id} sincronizada exitosamente`);

      } catch (err) {
        console.error(`❌ Error subiendo venta ${sale.id}:`, err);
        result.errors.push(`Venta ${sale.id}: ${err instanceof Error ? err.message : 'Error desconocido'}`);

        // Marcar como conflicto si falla después de reintentos
        await db.sales.update(sale.id!, { sync_status: 'conflict' });
      }
    }

    result.success = result.errors.length === 0;

    // Notificaciones
    if (result.success && result.itemsProcessed > 0) {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Ventas Sincronizadas',
        message: `${result.itemsProcessed} ventas subidas correctamente`
      });
    } else if (result.errors.length > 0) {
      useNotificationStore.getState().addNotification({
        type: 'warning',
        title: 'Sincronización de Ventas Parcial',
        message: `${result.itemsProcessed} exitosas, ${result.errors.length} con errores`,
        autoClose: false
      });
    }
  } catch (err) {
    console.error('❌ Error general sincronizando ventas:', err);
    result.errors.push(err instanceof Error ? err.message : 'Error desconocido');
  }

  return result;
};

/**
 * Sincronización bidireccional de inventario
 * Sube actualizaciones de stock locales y descarga actualizaciones remotas
 */
export const syncInventory = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    errors: []
  };

  try {
    const storeId = getCurrentStoreId();

    // 1. Subir productos con stock modificado localmente
    const modifiedProducts = await db.products
      .where('sync_status')
      .equals('pending')
      .toArray();

    for (const product of modifiedProducts) {
      try {
        const { error } = await retryWithBackoff(async () => {
          return await supabase
            .from('products')
            .update({
              stock_quantity: product.stock_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);
        });

        if (error) throw error;

        await db.products.update(product.id!, { sync_status: 'synced' });
        result.itemsProcessed++;
      } catch (err) {
        result.errors.push(`Producto ${product.id}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    // 2. Descargar actualizaciones de inventario desde Supabase
    const { data: remoteInventory, error: fetchError } = await retryWithBackoff(async () => {
      return await supabase
        .from('products')
        .select('id, stock_quantity, updated_at');
      // .eq('is_active', true);
    });

    if (fetchError) throw fetchError;

    if (remoteInventory) {
      for (const remote of remoteInventory) {
        const local = await db.products.get(remote.id);

        if (local && local.sync_status !== 'pending') {
          // Solo actualizar si no hay cambios locales pendientes
          await db.products.update(remote.id, {
            stock_quantity: remote.stock_quantity
          });
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    console.error('❌ Error sincronizando inventario:', err);
    result.errors.push(err instanceof Error ? err.message : 'Error desconocido');
  }

  return result;
};

/**
 * Sincronización completa (down + up)
 * Ejecutar periódicamente o en eventos específicos
 */
export const fullSync = async (): Promise<{
  products: SyncResult;
  sales: SyncResult;
  inventory: SyncResult;
}> => {
  console.log('🔄 Iniciando sincronización completa...');

  const products = await syncProductsDown();
  const sales = await syncSalesUp();
  const inventory = await syncInventory();

  console.log('✅ Sincronización completa finalizada');
  console.log('Productos:', products);
  console.log('Ventas:', sales);
  console.log('Inventario:', inventory);

  return { products, sales, inventory };
};