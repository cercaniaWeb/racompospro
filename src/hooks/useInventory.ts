import { useEffect } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Inventory } from '@/lib/supabase/types';

export const useInventory = (storeId?: string) => {
  const { inventory, loading, error, fetchInventory, updateInventory, setError } = useInventoryStore();

  useEffect(() => {
    fetchInventory(storeId || undefined);
  }, [fetchInventory, storeId]);

  return {
    inventory,
    loading,
    error,
    fetchInventory: (storeId?: string) => fetchInventory(storeId),
    updateInventory: (id: string, quantity: number) => updateInventory(id, quantity),
    setError
  };
};