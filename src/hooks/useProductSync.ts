import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { db, Product } from '@/lib/db';
import { useNotifications } from '@/store/notificationStore';

export const useProductSync = (storeId?: string) => {
    const [syncing, setSyncing] = useState(false);
    const { notify } = useNotifications();

    const syncProducts = useCallback(async () => {
        if (!storeId) return;

        try {
            setSyncing(true);
            console.log('🔄 Syncing products for store:', storeId);

            // 1. Fetch active products
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select('*');
            // .eq('is_active', true); // Removed as column does not exist

            if (prodError) throw prodError;

            // 2. Fetch inventory for this store
            const { data: inventory, error: invError } = await supabase
                .from('inventory')
                .select('product_id, stock, min_stock')
                .eq('store_id', storeId);

            if (invError) throw invError;

            // Map inventory for quick lookup
            const inventoryMap = new Map(
                inventory?.map(i => [i.product_id, i]) || []
            );

            // 3. Prepare data for Dexie
            const productsToSave: Product[] = products.map(p => {
                const inv = inventoryMap.get(p.id);
                return {
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    description: p.description,
                    price: Number(p.price),
                    stock_quantity: inv?.stock || 0,
                    min_stock_level: inv?.min_stock || 0,
                    category_id: p.category_id,
                    is_active: true, // Default to true as column missing in DB
                    is_taxable: true, // Default
                    is_weighted: p.is_weighted || false,
                    sync_status: 'synced',
                    last_modified: new Date(),
                    image_url: p.image_url
                };
            });

            // 4. Clear and Bulk Put
            // We clear to ensure we don't have stale data, but this might be aggressive.
            // Better to use bulkPut which updates if key exists.
            // But since Dexie ID is auto-increment, we might duplicate if we don't clear.
            // Strategy: Clear all products and re-populate.
            await db.products.clear();
            await db.products.bulkPut(productsToSave);

            console.log(`✅ Synced ${productsToSave.length} products`);
            // notify.success('Sincronización', `${productsToSave.length} productos actualizados`);

        } catch (error: any) {
            console.error('Error syncing products:', error);
            notify.error('Error de Sincronización', error.message);
        } finally {
            setSyncing(false);
        }
    }, [storeId, notify]);

    return {
        syncing,
        syncProducts
    };
};
