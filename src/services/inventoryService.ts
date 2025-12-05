import { supabase } from '@/lib/supabase/client';
import { Inventory } from '@/lib/supabase/types';

interface UpdateInventoryPricingParams {
    inventoryId: string;
    customSellingPrice?: number | null;
    customCostPrice?: number | null;
}

interface UpdateInventoryStockParams {
    inventoryId: string;
    stock: number;
    minStock?: number;
    maxStock?: number | null;
}

interface ToggleProductAvailabilityParams {
    inventoryId: string;
    isActive: boolean;
}

/**
 * Servicio para gestionar inventario con precios personalizados por tienda
 */
export class InventoryService {
    /**
     * Actualiza los precios personalizados de un producto en una tienda
     * Si se pasa null, el producto usará el precio global
     */
    static async updatePricing({
        inventoryId,
        customSellingPrice,
        customCostPrice
    }: UpdateInventoryPricingParams): Promise<Inventory> {
        const { data, error } = await supabase
            .from('inventory')
            .update({
                custom_selling_price: customSellingPrice,
                custom_cost_price: customCostPrice,
                updated_at: new Date().toISOString()
            })
            .eq('id', inventoryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Actualiza el stock y niveles mínimo/máximo
     */
    static async updateStock({
        inventoryId,
        stock,
        minStock,
        maxStock
    }: UpdateInventoryStockParams): Promise<Inventory> {
        const updates: any = {
            stock,
            updated_at: new Date().toISOString()
        };

        if (minStock !== undefined) updates.min_stock = minStock;
        if (maxStock !== undefined) updates.max_stock = maxStock;

        const { data, error } = await supabase
            .from('inventory')
            .update(updates)
            .eq('id', inventoryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Activa o desactiva un producto en una tienda específica
     */
    static async toggleAvailability({
        inventoryId,
        isActive
    }: ToggleProductAvailabilityParams): Promise<Inventory> {
        const { data, error } = await supabase
            .from('inventory')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', inventoryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Obtiene el inventario de una tienda con productos activos
     */
    static async getStoreInventory(storeId: string, activeOnly = true): Promise<Inventory[]> {
        let query = supabase
            .from('inventory')
            .select('*')
            .eq('store_id', storeId);

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Crea un registro de inventario para agregar un producto del catálogo global a una tienda
     */
    static async addProductToStore(
        productId: string,
        storeId: string,
        initialStock = 0,
        customPrice?: number,
        customCost?: number
    ): Promise<Inventory> {
        const { data, error } = await supabase
            .from('inventory')
            .insert([{
                product_id: productId,
                store_id: storeId,
                stock: initialStock,
                is_active: true,
                min_stock: 0,
                custom_selling_price: customPrice || null,
                custom_cost_price: customCost || null,
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Obtiene productos con bajo stock en una tienda
     */
    static async getLowStockProducts(storeId: string): Promise<Inventory[]> {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .filter('stock', 'lt', 'min_stock');

        if (error) throw error;
        return data || [];
    }
}
