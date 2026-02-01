import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/supabase/types';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>, storeId?: string) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchProducts: async () => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      set({ products: data as Product[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addProduct: async (productData, targetStoreId) => {
    set({ loading: true, error: null });

    try {
      // 1. Crear el producto
      // Extract batch fields and other non-schema fields
      // @ts-ignore
      const { batch_number, expiry_date, is_active, selling_price, measurement_unit, ...rest } = productData;

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...rest,
          // Map measurement_unit to unit
          // @ts-ignore
          unit: measurement_unit || 'unit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Crear inventario para la sucursal actual o la seleccionada
      const storeId = targetStoreId || (typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null);

      if (storeId && data) {
        const { error: invError } = await supabase
          .from('inventory')
          .insert([{
            product_id: data.id,
            store_id: storeId,
            stock: productData.stock || 0,
            is_active: true,
            min_stock: productData.min_stock || 0,
            max_stock: null,
            // Custom prices can be set later; initially use null to fall back to product prices
            custom_selling_price: null,
            custom_cost_price: null,
          }]);

        if (invError) {
          console.error('Error creating inventory:', invError);
        }

        // 3. Handle Batch Creation if applicable
        // @ts-ignore - these properties are passed but not in the Product type definition yet
        if (productData.is_batch_tracked && productData.batch_number && productData.expiry_date) {
          console.log('Creating initial batch for product:', data.name);

          // Create the batch
          const { data: batchData, error: batchError } = await supabase
            .from('product_batches')
            .insert([{
              product_id: data.id,
              // @ts-ignore
              batch_number: productData.batch_number,
              // @ts-ignore
              expiry_date: productData.expiry_date,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (batchError) {
            console.error('Error creating product batch:', batchError);
          } else if (batchData) {
            // Add initial stock to this batch
            const { error: batchLevelError } = await supabase
              .from('inventory_batch_levels')
              .insert([{
                store_id: storeId,
                batch_id: batchData.id,
                quantity: productData.stock || 0,
                updated_at: new Date().toISOString()
              }]);

            if (batchLevelError) {
              console.error('Error creating batch level:', batchLevelError);
            }
          }
        }
      }

      set((state) => ({
        products: [...state.products, data as Product],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? (data as Product) : product
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });

    try {
      console.log('[DELETE PRODUCT] Iniciando eliminación para ID:', id);

      // 1. Primero eliminar registros de inventario asociados
      console.log('[DELETE PRODUCT] Paso 1: Eliminando inventario...');
      const { error: invError, data: invData } = await supabase
        .from('inventory')
        .delete()
        .eq('product_id', id)
        .select();

      if (invError) {
        console.warn('[DELETE PRODUCT] Advertencia al eliminar inventario:', invError);
        console.warn('[DELETE PRODUCT] Detalles del error:', JSON.stringify(invError, null, 2));
      } else {
        console.log('[DELETE PRODUCT] Inventario eliminado exitosamente:', invData);
      }

      // 2. Luego eliminar el producto
      console.log('[DELETE PRODUCT] Paso 2: Eliminando producto...');
      const { error, data } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('[DELETE PRODUCT] Error al eliminar producto:', error);
        console.error('[DELETE PRODUCT] Código de error:', error.code);
        console.error('[DELETE PRODUCT] Mensaje:', error.message);
        console.error('[DELETE PRODUCT] Detalles completos:', JSON.stringify(error, null, 2));

        // Mensajes más descriptivos
        let errorMessage = 'Error al eliminar el producto';
        if (error.code === 'PGRST301') {
          errorMessage = 'No tienes permisos para eliminar productos. Contacta al administrador.';
        } else if (error.code === '23503') {
          errorMessage = 'No se puede eliminar: el producto tiene referencias en otras tablas.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }

        alert(errorMessage);
        set({ loading: false, error: error.message });
        throw error;
      }

      console.log('[DELETE PRODUCT] Producto eliminado exitosamente del servidor:', data);

      // 3. Actualizar estado local
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        loading: false,
      }));

      console.log('[DELETE PRODUCT] Estado local actualizado');
      alert('Producto eliminado correctamente');
    } catch (error: any) {
      console.error('[DELETE PRODUCT] Error capturado en catch:', error);
      set({ error: error.message, loading: false });
    }
  },
}));