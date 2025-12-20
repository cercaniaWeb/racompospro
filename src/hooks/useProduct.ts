import { useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/lib/supabase/types';

export const useProduct = () => {
  const { products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct, setError } = useProductStore();

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, storeId?: string) => addProduct(productData, storeId),
    updateProduct: (id: string, updates: Partial<Product>) => updateProduct(id, updates),
    deleteProduct: (id: string) => deleteProduct(id),
    setError
  };
};