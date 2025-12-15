import React, { useEffect, useState } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { parseProductVoiceCommand } from '@/utils/voiceParser';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/lib/supabase/types';
import { Mic, MicOff, Save, RotateCcw, Check, AlertTriangle } from 'lucide-react';

export const VoiceInventory = () => {
    const { 
        isListening, 
        transcript, 
        interimTranscript, 
        error: voiceError, 
        startListening, 
        stopListening, 
        resetTranscript 
    } = useVoiceInput();

    const { addProduct, loading, error: storeError } = useProductStore();

    const [form, setForm] = useState<Partial<Product>>({
        name: '',
        price: 0,
        cost: 0,
        stock: 0,
        sku: '',
        barcode: '',
        min_stock: 5,
        category: '',
        is_weighted: false,
        measurement_unit: 'pz'
    });

    const [lastTranscriptProcessed, setLastTranscriptProcessed] = useState('');

    // Effect to parse transcript as it updates
    useEffect(() => {
        // Only parse if transcript has changed and has enough length
        if (transcript && transcript !== lastTranscriptProcessed) {
            const parsed = parseProductVoiceCommand(transcript);
            
            // Merge valid parsed fields into form
            setForm(prev => ({
                ...prev,
                ...parsed
            }));
            
            setLastTranscriptProcessed(transcript);
        }
    }, [transcript, lastTranscriptProcessed]);

    const handleSave = async () => {
        if (!form.name || !form.price) {
            alert('Nombre y Precio son obligatorios');
            return;
        }

        try {
            // Generate basic SKU if missing
            const finalSku = form.sku || form.barcode || `SKU-${Date.now()}`;
            
            await addProduct({
                ...form,
                name: form.name,
                price: Number(form.price),
                cost: Number(form.cost || 0),
                min_stock: Number(form.min_stock || 0),
                sku: finalSku,
                barcode: form.barcode || undefined,
                stock: Number(form.stock || 0),
                is_active: true,
                category: form.category || 'General',
                is_weighted: form.is_weighted || false,
                measurement_unit: form.is_weighted ? 'kg' : 'pz'
            } as any);

            // Reset after success
            resetTranscript();
            setLastTranscriptProcessed('');
            setForm({
                name: '',
                price: 0,
                cost: 0,
                stock: 0,
                sku: '',
                barcode: '',
                min_stock: 5,
                category: '',
                is_weighted: false,
                measurement_unit: 'pz'
            });
            alert('Producto guardado exitosamente');
        } catch (err) {
            console.error(err);
        }
    };

    const handleClear = () => {
        resetTranscript();
        setLastTranscriptProcessed('');
        setForm({
            name: '',
            price: 0,
            cost: 0,
            stock: 0,
            sku: '',
            barcode: '',
            min_stock: 5,
            category: '',
            is_weighted: false,
            measurement_unit: 'pz'
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Registro por Voz
                </h2>
                <p className="text-gray-500">
                    Di comandos como: "Producto Coca Cola Precio 15 Stock 20"
                </p>
            </div>

            {/* Voice Controls */}
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`
                        relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                        ${isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl hover:-translate-y-1'
                        }
                    `}
                >
                    {isListening ? (
                        <MicOff className="w-10 h-10 text-white" />
                    ) : (
                        <Mic className="w-10 h-10 text-white" />
                    )}
                </button>
                
                <div className="mt-6 w-full max-w-lg min-h-[60px] p-4 bg-gray-50 rounded-xl text-center text-lg text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {transcript || interimTranscript || (
                        <span className="text-gray-400 italic">...escuchando...</span>
                    )}
                </div>

                {voiceError && (
                    <p className="mt-2 text-red-500 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {voiceError}
                    </p>
                )}
            </div>

            {/* Form & Preview Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Form Inputs */}
                <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Datos Detectados</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nombre del Producto</label>
                        <input
                            type="text"
                            value={form.name || ''}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ej. Papas Sabritas"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                         <input 
                            type="checkbox"
                            checked={form.is_weighted || false}
                            onChange={(e) => setForm({...form, is_weighted: e.target.checked, measurement_unit: e.target.checked ? 'kg' : 'pz'})}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            id="weightedCheck"
                         />
                         <label htmlFor="weightedCheck" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            Se vende por peso (kg)
                         </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Precio Venta</label>
                            <input
                                type="number"
                                value={form.price || ''}
                                onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Costo Compra</label>
                            <input
                                type="number"
                                value={form.cost || ''}
                                onChange={(e) => setForm({...form, cost: parseFloat(e.target.value)})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Stock Inicial</label>
                            <input
                                type="number"
                                value={form.stock || ''}
                                onChange={(e) => setForm({...form, stock: parseFloat(e.target.value)})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Código Barra/SKU</label>
                            <input
                                type="text"
                                value={form.barcode || ''}
                                onChange={(e) => setForm({...form, barcode: e.target.value, sku: e.target.value})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl transform transition-all hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-gray-400 text-sm uppercase tracking-wider">Vista Previa</h4>
                                <h2 className="text-2xl font-bold mt-1 line-clamp-2">{form.name || 'Sin Nombre'}</h2>
                            </div>
                            <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                                {form.category || 'General'}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <span className="block text-xs text-gray-400">Precio</span>
                                <span className="text-xl font-bold text-green-400">${form.price?.toFixed(2)}</span>
                            </div>
                            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <span className="block text-xs text-gray-400">Stock</span>
                                <span className="text-xl font-bold text-blue-400">{form.stock}</span>
                            </div>
                            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <span className="block text-xs text-gray-400">Margen</span>
                                <span className="text-xl font-bold text-orange-400">
                                    {form.price && form.cost ? Math.round(((form.price - form.cost) / form.cost) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        {storeError && (
                            <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm mb-4">
                                Error guardar: {storeError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 bg-white text-gray-900 text-center py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? 'Guardando...' : <><Save className="w-5 h-5" /> Confirmar</>}
                            </button>
                            <button 
                                onClick={handleClear}
                                className="px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                           <Check className="w-4 h-4" /> Tips de Voz
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Di "Producto [Nombre]" para el nombre.</li>
                            <li>"Precio [número]" para el precio venta.</li>
                            <li>"Costo [número]" para el costo de compra.</li>
                            <li>"Stock [número]" e inventario inicial.</li>
                            <li>Di "por peso", "a granel", o "kilo" para activar peso.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
