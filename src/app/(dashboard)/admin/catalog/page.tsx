'use client';

import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { useProduct } from '@/hooks/useProduct';

import { useModal } from '@/hooks/useModal';
import RoleGuard from '@/components/auth/RoleGuard';
import { Globe, Plus, Edit, Trash2, Package, Store } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

const MasterCatalogPage = () => {
    const { products, loading, error, addProduct, updateProduct, deleteProduct } = useProduct();
    const { stores } = useStores();
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newProduct, setNewProduct] = useState({
        name: '',
        selling_price: '',
        cost: '',
        category: '',
        barcode: '',
        sku: '',
        description: '',
        measurement_unit: 'unit',
        is_weighted: false,
        stock: '',
        min_stock: '',
        is_batch_tracked: false,
        image_url: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');

    const { modalRef, handleBackdropClick } = useModal({
        onClose: () => {
            setShowAddProductModal(false);
            setEditingId(null);
            resetForm();
        },
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    const resetForm = () => {
        setNewProduct({
            name: '',
            selling_price: '',
            cost: '',
            category: '',
            barcode: '',
            sku: '',
            description: '',
            measurement_unit: 'unit',
            is_weighted: false,
            stock: '',
            min_stock: '',
            is_batch_tracked: false,
            image_url: ''
        });
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setNewProduct({
            name: product.name,
            selling_price: (product.selling_price ?? product.price ?? 0).toString(),
            cost: (product.cost_price ?? product.cost ?? 0).toString(),
            category: product.category || '',
            barcode: product.barcode || '',
            sku: product.sku || '',
            description: product.description || '',
            measurement_unit: product.measurement_unit || 'unit',
            is_weighted: product.is_weighted || false,
            stock: (product.store_stock ?? product.stock ?? 0).toString(),
            min_stock: (product.min_stock ?? 0).toString(),
            is_batch_tracked: product.is_batch_tracked || false,
            image_url: product.image_url || ''
        });
        setShowAddProductModal(true);
    };

    const handleSaveProduct = async () => {
        if (!newProduct.name || !newProduct.selling_price) return;

        try {
            const productData = {
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.selling_price),
                cost: parseFloat(newProduct.cost) || 0,
                sku: newProduct.sku,
                barcode: newProduct.barcode || undefined,
                min_stock: parseInt(newProduct.min_stock) || 0,
                stock: parseInt(newProduct.stock) || 0,
                image_url: newProduct.image_url || '',
                is_weighted: newProduct.is_weighted,
                is_batch_tracked: newProduct.is_batch_tracked,
                category: newProduct.category
            };

            if (editingId) {
                await updateProduct(editingId, productData);
                alert('Producto actualizado correctamente');
            } else {
                await addProduct(productData, selectedStoreId || undefined);
                alert('Producto creado correctamente');
            }

            setShowAddProductModal(false);
            setEditingId(null);
            resetForm();
        } catch (err: any) {
            console.error('Error saving product:', err);
            alert(`Error al guardar producto: ${err.message || 'Error desconocido'}`);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <RoleGuard roles={['admin']} redirectTo="/products">
            <div>
                {/* Header */}
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/50">
                                <Globe className="text-blue-400" size={32} />
                            </div>
                            <div>
                                <h1 className="text-white text-2xl font-bold">Catálogo Maestro</h1>
                                <p className="text-gray-400 text-sm mt-1">
                                    Gestión global de productos para todas las sucursales
                                </p>
                            </div>
                        </div>
                        <Button variant="primary" onClick={() => {
                            setEditingId(null);
                            resetForm();
                            setShowAddProductModal(true);
                        }}>
                            <Plus size={20} className="mr-2" />
                            Nuevo Producto Global
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 mb-6">
                    <InputField
                        label="Buscar"
                        type="text"
                        placeholder="Buscar por nombre, SKU o código de barras..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
                        Error: {error}
                    </div>
                )}

                {/* Products Table */}
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr className="text-left text-gray-300 text-sm">
                                    <th className="p-4 font-medium">Producto</th>
                                    <th className="p-4 font-medium">SKU</th>
                                    <th className="p-4 font-medium">Código de Barras</th>
                                    <th className="p-4 font-medium text-right">Precio Global</th>
                                    <th className="p-4 font-medium text-right">Costo Global</th>
                                    <th className="p-4 font-medium">Categoría</th>
                                    <th className="p-4 font-medium text-center">Estado</th>
                                    <th className="p-4 font-medium text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-gray-500">
                                            Cargando productos...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center">
                                            <Package className="mx-auto text-gray-600 mb-4" size={48} />
                                            <p className="text-gray-400">No se encontraron productos en el catálogo maestro</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-white font-medium">{product.name}</p>
                                                    {product.description && (
                                                        <p className="text-gray-400 text-sm">{product.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300 font-mono text-sm">{product.sku}</td>
                                            <td className="p-4 text-gray-300 font-mono text-sm">{product.barcode || '-'}</td>
                                            <td className="p-4 text-right text-green-400 font-bold">
                                                ${(product.selling_price ?? product.price ?? 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right text-gray-300">
                                                ${(product.cost_price ?? product.cost ?? 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-gray-300">{product.category || '-'}</td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                        }`}
                                                >
                                                    {product.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                        onClick={() => {
                                                            if (confirm('¿Estás seguro de eliminar este producto del catálogo global?')) {
                                                                deleteProduct(product.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {showAddProductModal && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={handleBackdropClick}
                >
                    <div ref={modalRef} className="glass rounded-2xl p-6 w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            {editingId ? 'Editar Producto Global' : 'Nuevo Producto Global'}
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">
                            {editingId
                                ? 'Modifica los datos del producto global. Los cambios se reflejarán en todas las sucursales.'
                                : 'Este producto estará disponible para todas las sucursales. Cada sucursal podrá personalizar precios y stock.'
                            }
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 1. Nombre del Producto */}
                            <div className="md:col-span-2">
                                <InputField
                                    label="Nombre del Producto *"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="Ej. Coca Cola 600ml"
                                    required
                                />
                            </div>

                            {/* 2. Descripción */}
                            <div className="md:col-span-2">
                                <InputField
                                    label="Descripción"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Descripción del producto"
                                />
                            </div>

                            {/* 3. Precio de Venta */}
                            <InputField
                                label="Precio de Venta *"
                                type="number"
                                step="0.01"
                                value={newProduct.selling_price}
                                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                                placeholder="0.00"
                                required
                            />

                            {/* 4. Costo */}
                            <InputField
                                label="Costo *"
                                type="number"
                                step="0.01"
                                value={newProduct.cost}
                                onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                                placeholder="0.00"
                            />

                            {/* 5. SKU */}
                            <InputField
                                label="SKU *"
                                value={newProduct.sku}
                                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                placeholder="Código SKU único"
                                required
                            />

                            {/* 6. Código de Barras */}
                            <InputField
                                label="Código de Barras *"
                                value={newProduct.barcode}
                                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                                placeholder="Código de barras UPC/EAN"
                            />

                            {/* 7. Categoría */}
                            <div className="md:col-span-2">
                                <InputField
                                    label="Categoría *"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    placeholder="Categoría del producto"
                                />
                            </div>

                            {/* 8. Stock Inicial */}
                            <div>
                                <InputField
                                    label="Stock Inicial *"
                                    type="number"
                                    value={newProduct.stock}
                                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                    placeholder="0"
                                />
                                {parseInt(newProduct.stock) > 0 && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Tienda Destino del Stock
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedStoreId}
                                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">-- Selecciona una tienda --</option>
                                                {stores.map(store => (
                                                    <option key={store.id} value={store.id}>
                                                        {store.name} ({store.type === 'central' ? 'Central' : 'Sucursal'})
                                                    </option>
                                                ))}
                                            </select>
                                            <Store className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 9. Stock Mínimo */}
                            <InputField
                                label="Stock Mínimo *"
                                type="number"
                                value={newProduct.min_stock}
                                onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
                                placeholder="0"
                            />

                            {/* 10. Venta a Granel / Por Peso (Weighted) */}
                            <div className="md:col-span-2 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newProduct.is_weighted}
                                        onChange={(e) => setNewProduct({ ...newProduct, is_weighted: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Venta a Granel / Por Peso</span>
                                        <p className="text-gray-400 text-sm">
                                            Habilitar para usar con la báscula (Kg)
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* 11. Controlar por Lotes / Caducidad */}
                             <div className="md:col-span-2 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newProduct.is_batch_tracked}
                                        onChange={(e) => setNewProduct({ ...newProduct, is_batch_tracked: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Controlar por Lotes / Caducidad</span>
                                        <p className="text-gray-400 text-sm">
                                            Habilitar para productos perecederos
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* 12. Imagen del Producto */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Imagen del Producto</label>
                                <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                                            {newProduct.image_url ? (
                                                <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-500">Sin imagen</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            <span className="text-blue-400 font-medium hover:underline cursor-pointer">Seleccionar archivo</span> o arrastrar y soltar
                                        </p>
                                        <p className="text-xs text-gray-600">PNG, JPG, GIF hasta 10MB</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={(e) => {
                                             e.preventDefault();
                                             // Random unsplash image for demo
                                             setNewProduct(prev => ({...prev, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}));
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        ✨ Auto-generar Imagen
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => {
                                setShowAddProductModal(false);
                                setEditingId(null);
                                resetForm();
                            }}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSaveProduct}>
                                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </RoleGuard>
    );
};

export default MasterCatalogPage;
