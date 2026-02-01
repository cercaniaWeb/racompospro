import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Package, AlertTriangle, Scale } from 'lucide-react';

interface PurchaseEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    suggestedQty: number;
    currentCost: number;
    onSave: (details: { cost: number; quantity: number; isWeighted: boolean }) => void;
}

const PurchaseEntryModal: React.FC<PurchaseEntryModalProps> = ({
    isOpen,
    onClose,
    productName,
    suggestedQty,
    currentCost,
    onSave
}) => {
    const [cost, setCost] = useState(currentCost.toString());
    const [quantity, setQuantity] = useState(suggestedQty.toString());
    const [isWeighted, setIsWeighted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCost(currentCost.toString());
            setQuantity(suggestedQty.toString());
            setIsWeighted(false);
        }
    }, [isOpen, currentCost, suggestedQty]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            cost: parseFloat(cost) || 0,
            quantity: parseFloat(quantity) || 0,
            isWeighted
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Package className="text-blue-400" size={20} />
                        Confirmar Compra
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-1">
                        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Producto</span>
                        <div className="text-xl font-medium text-white">{productName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <DollarSign size={14} /> Costo Unitario
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle size={14} /> Cantidad
                            </label>
                            <input
                                type="number"
                                step={isWeighted ? "0.001" : "1"}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => setIsWeighted(!isWeighted)}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isWeighted ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
                                <Scale size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-200">Producto por Peso</div>
                                <div className="text-xs text-gray-500">{isWeighted ? 'Se medirá en Kilogramos (kg)' : 'Se medirá en Piezas (pza)'}</div>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isWeighted ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isWeighted ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Save size={20} />
                        Guardar Compra
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PurchaseEntryModal;
