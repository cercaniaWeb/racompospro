'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { X, Plus, Trash2, Package } from 'lucide-react';

interface TransferItem {
    product_id: string;
    product_name: string;
    quantity: number;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transfer: {
        origin_store_id: string;
        destination_store_id: string;
        items: TransferItem[];
        notes?: string;
    }) => void;
    stores: Array<{ id: string; name: string }>;
    products: Array<{ id: string; name: string; sku: string }>;
    currentStoreId?: string | null;
}

const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    stores,
    products,
    currentStoreId
}) => {
    const [originStore, setOriginStore] = useState('');
    const [destStore, setDestStore] = useState('');
    const [items, setItems] = useState<TransferItem[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setOriginStore(currentStoreId || '');
            setDestStore('');
            setItems([]);
            setNotes('');
            setSelectedProduct('');
            setQuantity('');
        }
    }, [isOpen, currentStoreId]);

    const handleAddItem = () => {
        if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
            alert('Selecciona un producto y cantidad válida');
            return;
        }

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        // Check if product already in items
        const existingIndex = items.findIndex(i => i.product_id === selectedProduct);
        if (existingIndex >= 0) {
            // Update quantity
            const newItems = [...items];
            newItems[existingIndex].quantity += parseInt(quantity);
            setItems(newItems);
        } else {
            // Add new item
            setItems([...items, {
                product_id: selectedProduct,
                product_name: product.name,
                quantity: parseInt(quantity)
            }]);
        }

        setSelectedProduct('');
        setQuantity('');
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!originStore || !destStore) {
            alert('Selecciona tienda de origen y destino');
            return;
        }

        if (originStore === destStore) {
            alert('La tienda de origen y destino no pueden ser la misma');
            return;
        }

        if (items.length === 0) {
            alert('Agrega al menos un producto a la transferencia');
            return;
        }

        onSubmit({
            origin_store_id: originStore,
            destination_store_id: destStore,
            items,
            notes
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="glass rounded-2xl w-full max-w-3xl border border-white/10 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-foreground">Nueva Transferencia</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Store Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Tienda Solicitante (Tu sucursal) *
                            </label>
                            <select
                                value={originStore}
                                onChange={(e) => setOriginStore(e.target.value)}
                                disabled={true} // Siempre es la sucursal actual
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-400 cursor-not-allowed"
                            >
                                <option value="" className="bg-gray-800 text-white">Selecciona tienda...</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id} className="bg-gray-800 text-white">
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">Eres quien solicita la mercancía</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Proveedor (A quien le pides) *
                            </label>
                            <select
                                value={destStore}
                                onChange={(e) => setDestStore(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" className="bg-gray-800 text-white">Selecciona tienda...</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id} className="bg-gray-800 text-white">
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">Sucursal que enviará los productos</p>
                        </div>
                    </div>

                    {/* Add Products */}
                    <div className="border border-white/10 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Agregar Productos</h3>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-7">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Producto
                                </label>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" className="bg-gray-800 text-white">Selecciona producto...</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id} className="bg-gray-800 text-white">
                                            {product.name} ({product.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-end">
                                <Button
                                    variant="primary"
                                    onClick={handleAddItem}
                                    className="w-full"
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    {items.length > 0 && (
                        <div className="border border-white/10 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                Productos a Transferir ({items.length})
                            </h3>

                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package size={20} className="text-blue-400" />
                                            <div>
                                                <p className="text-foreground font-medium">{item.product_name}</p>
                                                <p className="text-sm text-gray-400">Cantidad: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Notas (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Agregar notas sobre esta transferencia..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Crear Transferencia
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
