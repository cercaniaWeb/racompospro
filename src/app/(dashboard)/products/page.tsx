'use client';

import React, { useState, useEffect } from 'react';
import ProductList from '@/components/organisms/ProductList';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import PriceEditModal from '@/components/molecules/PriceEditModal';
import { useProduct } from '@/hooks/useProduct';
import { calculateProductsPricing, ProductWithInventory } from '@/hooks/useProductPricing';
import { Product, Inventory } from '@/lib/supabase/types';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import { useInventoryStore } from '@/store/inventoryStore';
import { DollarSign } from 'lucide-react';

const ProductsPage = () => {
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = useProduct();
  const { inventory, fetchInventory } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '',
    category: '',
    barcode: '',
    sku: '',
    description: '',
    is_weighted: false
  });

  const { modalRef, handleBackdropClick } = useModal({
    onClose: () => setShowAddProductModal(false),
    closeOnEscape: true,
    closeOnClickOutside: true
  });
  const { logout, user: authUser } = useAuthStore();
  const router = useRouter();

  const currentStoreId = typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null;

  // Fetch inventory when component mounts or store changes
  useEffect(() => {
    if (currentStoreId) {
      fetchInventory(currentStoreId);
    }
  }, [currentStoreId, fetchInventory]);

  // Combine products with inventory using the pricing utility
  const productsWithPricing = React.useMemo(() => calculateProductsPricing(products, inventory), [products, inventory]);

  // Filter to show only products that have inventory in this store AND match search query
  const storeProducts = productsWithPricing.filter(p => {
    const hasInventory = p.inventory !== undefined;
    if (!hasInventory) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.barcode?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const user = {
    name: authUser?.name || 'Admin User',
    status: 'online' as const,
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleEditPrice = (productWithPricing: ProductWithInventory) => {
    if (!productWithPricing.inventory) {
      alert('Este producto aún no está agregado al inventario de esta tienda.');
      return;
    }
    setSelectedProduct(productWithPricing);
    setShowPriceEditModal(true);
  };

  const handlePriceUpdateSuccess = () => {
    // Refresh inventory after price update
    if (currentStoreId) {
      fetchInventory(currentStoreId);
    }
  };

  const handleAddToCart = (product: any) => {
    console.log('Add to cart clicked for product:', product);
    // In a real implementation, this would add to a shopping cart
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;

    try {
      await addProduct({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        selling_price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category || 'General',
        barcode: newProduct.barcode,
        sku: newProduct.sku,
        description: newProduct.description || '',
        min_stock: parseInt(newProduct.min_stock) || 5,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', // Placeholder
        is_active: true,
        is_weighted: newProduct.is_weighted,
        measurement_unit: newProduct.is_weighted ? 'kg' : 'unit'
      });
      setShowAddProductModal(false);
      setNewProduct({ name: '', price: '', cost: '', stock: '', min_stock: '', category: '', barcode: '', sku: '', description: '', is_weighted: false });

      // Refresh inventory to show the new product
      if (currentStoreId) {
        fetchInventory(currentStoreId);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Productos</h1>
          <p className="text-gray-400 text-sm mt-1">
            Productos disponibles en esta sucursal •{' '}
            <span className="text-blue-400">{storeProducts.length} productos</span>
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/products/nuevo')} className="w-full md:w-auto justify-center">
          Añadir Producto
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <ProductList
        products={storeProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.effectivePrice, // Use effective price instead of raw price
          image: p.image_url,
          stock: p.storeStock, // Use store-specific stock
          category: p.category,
          barcode: p.barcode,
          sku: p.sku,
          // Add custom action for price editing
          onPriceEdit: () => handleEditPrice(p),
          hasCustomPrice: p.inventory?.custom_selling_price !== null && p.inventory?.custom_selling_price !== undefined,
          isAvailable: p.isAvailable
        }))}
        onSearch={handleSearch}
        onAddToCart={handleAddToCart}
        viewMode="grid"
      />

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="glass rounded-2xl p-6 w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-foreground">Nuevo Producto</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Nombre del Producto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Ej. Coca Cola 600ml"
                required
              />
              <InputField
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="Opcional"
              />
              <InputField
                label="Precio"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="0.00"
                required
              />
              <InputField
                label="Costo"
                type="number"
                value={newProduct.cost}
                onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                placeholder="0.00"
              />
              <InputField
                label="Stock Inicial"
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="0"
              />
              <InputField
                label="Stock Mínimo"
                type="number"
                value={newProduct.min_stock}
                onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
                placeholder="5"
              />
              <InputField
                label="Categoría"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="Ej. Bebidas"
              />
              <InputField
                label="Código de Barras"
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                placeholder="Escanea o escribe..."
              />
              <div className="md:col-span-2 bg-gray-800/5 border border-gray-200 dark:bg-gray-800/30 dark:border-gray-700 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={newProduct.is_weighted}
                          onChange={(e) => setNewProduct({ ...newProduct, is_weighted: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                          <span className="text-gray-900 dark:text-white font-medium">Producto por peso</span>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                              El producto se venderá por kilogramo (kg) en lugar de por unidad
                          </p>
                      </div>
                  </label>
              </div>
              <div className="md:col-span-2">
                  <InputField
                      label="Descripción"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descripción del producto"
                  />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleCreateProduct}>Guardar Producto</Button>
            </div>
          </div>
        </div>
      )}

      {/* Price Edit Modal */}
      {showPriceEditModal && selectedProduct && selectedProduct.inventory && (
        <PriceEditModal
          isOpen={showPriceEditModal}
          onClose={() => {
            setShowPriceEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handlePriceUpdateSuccess}
          product={selectedProduct}
          inventory={selectedProduct.inventory}
        />
      )}
    </div>
  );
};

export default ProductsPage;