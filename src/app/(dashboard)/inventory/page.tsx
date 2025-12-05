'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/molecules/DataTable';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { useInventory } from '@/hooks/useInventory';
import { useProduct } from '@/hooks/useProduct';
import { useAuth } from '@/hooks/useAuth';
import { Filter, Plus, Edit, ArrowLeftRight } from 'lucide-react';

const InventoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { inventory, loading, error, updateInventory } = useInventory(user?.store_id);
  const { products } = useProduct();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');

  // Combine inventory with product information
  const inventoryWithProductInfo = inventory.map(invItem => {
    const product = products.find(p => p.id === invItem.product_id);
    return {
      ...invItem,
      productName: product?.name || 'Producto desconocido',
      productSKU: product?.sku || 'N/A',
      productCategory: product?.category || 'N/A',
    };
  });

  // Filter inventory
  const filteredInventory = inventoryWithProductInfo.filter(item => {
    // Search query filter
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productSKU.toLowerCase().includes(searchQuery.toLowerCase());

    // Stock status filter
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = item.stock <= (item.min_stock || 5) && item.stock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = item.stock === 0;
    }

    // Category filter
    let matchesCategory = true;
    if (categoryFilter) {
      matchesCategory = item.productCategory.toLowerCase() === categoryFilter.toLowerCase();
    }

    return matchesSearch && matchesStock && matchesCategory;
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditQuantity((item.stock ?? 0).toString());
  };

  const handleSaveEdit = async () => {
    if (editingItem && editQuantity) {
      try {
        await updateInventory(editingItem.id, parseInt(editQuantity));
        setEditingItem(null);
        setEditQuantity('');
      } catch (err) {
        console.error('Error updating inventory:', err);
        alert('Error al actualizar inventario');
      }
    }
  };

  const handleTransfer = (item: any) => {
    router.push(`/inventory/transferencias?product=${item.product_id}`);
  };

  const handleNewTransfer = () => {
    router.push('/inventory/transferencias');
  };

  const tableColumns = [
    { key: 'productName', title: 'Producto' },
    { key: 'productSKU', title: 'SKU' },
    { key: 'productCategory', title: 'Categoría' },
    { key: 'stock', title: 'Cantidad' },
    { key: 'reserved', title: 'Reservado' },
    {
      key: 'available',
      title: 'Disponible',
      render: (value: any, item: any) => item.stock - item.reserved
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (value: any, item: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(item)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
          >
            <Edit size={14} />
            Editar
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTransfer(item)}
          >
            Transferir
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Inventario</h1>
        <div className="flex space-x-4">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Filtrar
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/inventory/transferencias')}
            className="mr-2"
          >
            <ArrowLeftRight size={16} className="mr-2" />
            Transferencias
          </Button>
          <Button
            variant="primary"
            onClick={handleNewTransfer}
          >
            <Plus size={16} className="mr-2" />
            Nueva Transferencia
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass rounded-xl border border-white/10 shadow p-4 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Buscar por nombre"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre del producto..."
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado de Stock
              </label>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-foreground"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="low">Stock Bajo</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Categoría
              </label>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-foreground"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="bebidas">Bebidas</option>
                <option value="alimentos">Alimentos</option>
                <option value="lacteos">Lácteos</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="glass rounded-xl border border-white/10 shadow p-6">
        <DataTable
          data={filteredInventory}
          columns={tableColumns}
          showPagination={true}
        />
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="glass rounded-2xl p-6 w-full max-w-md border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-foreground">
              Editar Inventario
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Producto: <span className="text-foreground font-medium">{editingItem.productName}</span>
            </p>

            <InputField
              label="Cantidad"
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              placeholder="0"
            />

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;