import { Product } from '@/lib/supabase/types';
import { Inventory } from '@/lib/supabase/types';

export interface ProductWithInventory extends Product {
    inventory?: Inventory;
    effectivePrice: number;
    effectiveCost: number;
    storeStock: number;
    isAvailable: boolean;
}

/**
 * Función para calcular el precio efectivo de un producto basado en:
 * 1. Precio personalizado de la tienda (inventory.custom_selling_price)
 * 2. Precio global del producto (product.selling_price)
 * 
 * @param product - Producto global
 * @param inventory - Registro de inventario de la tienda (opcional)
 * @returns Producto enriquecido con precios efectivos e información de inventario
 */
export function calculateProductPricing(
    product: Product,
    inventory?: Inventory
): ProductWithInventory {
    const effectivePrice = inventory?.custom_selling_price ?? product.selling_price ?? product.price ?? 0;
    const effectiveCost = inventory?.custom_cost_price ?? product.cost_price ?? product.cost ?? 0;
    const storeStock = inventory?.stock ?? 0;
    const isAvailable = inventory?.is_active !== false && (product.is_active ?? false);

    return {
        ...product,
        inventory,
        effectivePrice,
        effectiveCost,
        storeStock,
        isAvailable
    };
}

/**
 * Función para procesar un array de productos con sus inventarios por tienda
 * 
 * @param products - Array de productos globales
 * @param inventories - Array de inventarios de la tienda
 * @returns Array de productos enriquecidos con información de precios e inventario
 */
export function calculateProductsPricing(
    products: Product[],
    inventories: Inventory[]
): ProductWithInventory[] {
    // Crear mapa de inventarios por product_id para búsqueda rápida
    const inventoryMap = new Map(
        inventories.map(inv => [inv.product_id, inv])
    );

    return products.map(product => {
        const inventory = inventoryMap.get(product.id);
        return calculateProductPricing(product, inventory);
    });
}
