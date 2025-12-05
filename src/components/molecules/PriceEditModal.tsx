import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { Product, Inventory } from '@/lib/supabase/types';
import { InventoryService } from '@/services/inventoryService';

interface PriceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: Product;
    inventory: Inventory;
}

const PriceEditModal: React.FC<PriceEditModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    product,
    inventory
}) => {
    const [customSellingPrice, setCustomSellingPrice] = useState('');
    const [customCostPrice, setCustomCostPrice] = useState('');
    const [useGlobalPrices, setUseGlobalPrices] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    useEffect(() => {
        if (isOpen && inventory) {
            // Initialize with existing custom prices or empty if using global
            if (inventory.custom_selling_price !== null && inventory.custom_selling_price !== undefined) {
                setCustomSellingPrice(inventory.custom_selling_price.toString());
                setUseGlobalPrices(false);
            } else {
                setCustomSellingPrice('');
                setUseGlobalPrices(true);
            }

            if (inventory.custom_cost_price !== null && inventory.custom_cost_price !== undefined) {
                setCustomCostPrice(inventory.custom_cost_price.toString());
            } else {
                setCustomCostPrice('');
            }
        }
        setError(null);
    }, [isOpen, inventory]);

    const globalPrice = product.selling_price ?? product.price ?? 0;
    const globalCost = product.cost_price ?? product.cost ?? 0;
    const currentEffectivePrice = inventory.custom_selling_price ?? globalPrice;
    const currentEffectiveCost = inventory.custom_cost_price ?? globalCost;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const newSellingPrice = useGlobalPrices
                ? null
                : (customSellingPrice ? parseFloat(customSellingPrice) : null);

            const newCostPrice = useGlobalPrices
                ? null
                : (customCostPrice ? parseFloat(customCostPrice) : null);

            // Validate that cost is not higher than selling price
            if (newSellingPrice && newCostPrice && newCostPrice > newSellingPrice) {
                setError('El costo no puede ser mayor que el precio de venta');
                setLoading(false);
                return;
            }

            await InventoryService.updatePricing({
                inventoryId: inventory.id,
                customSellingPrice: newSellingPrice,
                customCostPrice: newCostPrice
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al actualizar precios');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const calculateMargin = () => {
        const price = useGlobalPrices ? globalPrice : (parseFloat(customSellingPrice) || 0);
        const cost = useGlobalPrices ? globalCost : (parseFloat(customCostPrice) || 0);
        if (price === 0) return 0;
        return ((price - cost) / price * 100).toFixed(1);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <DollarSign className="text-green-400" size={24} />
                                Personalizar Precios
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">{product.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">SKU: {product.sku}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-2">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Price Source Toggle */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useGlobalPrices}
                                onChange={(e) => setUseGlobalPrices(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-white font-medium">Usar precios globales</span>
                                <p className="text-gray-400 text-sm">
                                    El producto usará los precios del catálogo maestro
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Global Prices Info */}
                    <div className="grid grid-cols-2 gap-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div>
                            <p className="text-blue-300 text-xs font-medium mb-1">Precio Global</p>
                            <p className="text-white text-lg font-bold">${globalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-blue-300 text-xs font-medium mb-1">Costo Global</p>
                            <p className="text-white text-lg font-bold">${globalCost.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Custom Prices */}
                    {!useGlobalPrices && (
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Precio de Venta Personalizado"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customSellingPrice}
                                onChange={(e) => setCustomSellingPrice(e.target.value)}
                                placeholder={globalPrice.toFixed(2)}
                                required={!useGlobalPrices}
                            />
                            <InputField
                                label="Costo Personalizado"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customCostPrice}
                                onChange={(e) => setCustomCostPrice(e.target.value)}
                                placeholder={globalCost.toFixed(2)}
                            />
                        </div>
                    )}

                    {/* Margin Indicator */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-green-400" size={20} />
                                <span className="text-gray-300 font-medium">Margen de Ganancia</span>
                            </div>
                            <span className="text-2xl font-bold text-green-400">
                                {calculateMargin()}%
                            </span>
                        </div>
                    </div>

                    {/* Current vs New Comparison */}
                    {!useGlobalPrices && customSellingPrice && (
                        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-white font-medium mb-3">Vista Previa</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 mb-1">Precio Actual</p>
                                    <p className="text-white font-bold text-lg">${currentEffectivePrice.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 mb-1">Precio Nuevo</p>
                                    <p className="text-green-400 font-bold text-lg">${parseFloat(customSellingPrice || '0').toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Precios'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PriceEditModal;
