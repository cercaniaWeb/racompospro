import { Product } from '@/lib/supabase/types';
import { Inventory } from '@/lib/supabase/types';

export interface ProductWithInventory extends Product {
    inventory?: Inventory;
    effectivePrice: number;
    effectiveCost: number;
    storeStock: number;
    stockTotal: number;
    isAvailable: boolean;
}

/**
 * Función para calcular el precio efectivo y existencias de un producto
 */
export function calculateProductPricing(
    product: Product,
    storeInventory?: Inventory,
    allProductInventories: Inventory[] = []
): ProductWithInventory {
    const effectivePrice = storeInventory?.custom_selling_price ?? product.selling_price ?? product.price ?? 0;
    const effectiveCost = storeInventory?.custom_cost_price ?? product.cost_price ?? product.cost ?? 0;
    
    // Existencias en la sucursal actual
    const storeStock = storeInventory?.stock ?? 0;
    
    // Existencias totales sumando todas las sucursales
    const stockTotal = allProductInventories.reduce((sum, inv) => sum + (inv.stock || 0), 0);
    
    const isAvailable = storeInventory?.is_active !== false && (product.is_active ?? false);

    return {
        ...product,
        inventory: storeInventory,
        effectivePrice,
        effectiveCost,
        storeStock,
        stockTotal,
        isAvailable
    };
}

/**
 * Procesa productos con sus inventarios filtrados por tienda y totales globales
 */
export function calculateProductsPricing(
    products: Product[],
    allInventories: Inventory[],
    currentStoreId?: string | null
): ProductWithInventory[] {
    // Agrupar inventarios por product_id para cálculos globales
    const inventoryByProduct = new Map<string, Inventory[]>();
    allInventories.forEach(inv => {
        const existing = inventoryByProduct.get(inv.product_id) || [];
        existing.push(inv);
        inventoryByProduct.set(inv.product_id, existing);
    });

    return products.map(product => {
        const productInventories = inventoryByProduct.get(product.id) || [];
        
        // Encontrar el inventario específico para la sucursal actual
        const storeInventory = currentStoreId 
            ? productInventories.find(inv => inv.store_id === currentStoreId)
            : undefined;

        return calculateProductPricing(product, storeInventory, productInventories);
    });
}
