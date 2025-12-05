import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Inventory } from '@/lib/supabase/types';

interface InventoryState {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
  fetchInventory: (storeId?: string) => Promise<void>;
  updateInventory: (id: string, quantity: number) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventory: [],
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchInventory: async (storeId) => {
    set({ loading: true, error: null });

    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .order('product_id', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ inventory: data as Inventory[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateInventory: async (id, quantity) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          stock: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        inventory: state.inventory.map((inv) =>
          inv.id === id ? (data as Inventory) : inv
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));