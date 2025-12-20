import React, { useEffect, useState, useRef } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/lib/supabase/types';
import { Mic, MicOff, Save, RotateCcw, Check, AlertTriangle, Play, Pause, Package, Barcode, DollarSign, Tag, Scale } from 'lucide-react';

type InteractionStep = 'IDLE' | 'NAME' | 'DESCRIPTION' | 'CATEGORY' | 'PRICE' | 'COST' | 'STOCK' | 'MIN_STOCK' | 'BARCODE' | 'WEIGHTED' | 'BATCH' | 'CONFIRM' | 'SUCCESS';

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

    const { speak, stopSpeaking } = useTextToSpeech();
    const { addProduct, loading, error: storeError } = useProductStore();

    const [step, setStep] = useState<InteractionStep>('IDLE');
    const [lastSavedProduct, setLastSavedProduct] = useState<Partial<Product> | null>(null);
    
    const [form, setForm] = useState<Partial<Product>>({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock: 0,
        sku: '',
        barcode: '',
        min_stock: 5,
        category: '',
        is_weighted: false,
        is_batch_tracked: false,
        measurement_unit: 'pz'
    });

    const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

    // Start conversational flow
    const startInteraction = () => {
        setStep('NAME');
        setLastSavedProduct(null);
        stopListening();
        speak("¿Cuál es el nombre del producto?", () => {
            resetTranscript();
            startListening();
        });
    };

    const nextStep = (currentStep: InteractionStep, value: string) => {
        // Strip out question text if it was captured
        let cleanValue = value.toLowerCase().trim();
        const commonPhrases = [
            "cuál es el nombre del producto", 
            "cuál es el precio de venta", 
            "cuál es el costo de compra",
            "a qué categoría pertenece",
            "qué cantidad tienes en stock",
            "cuál es el stock mínimo",
            "tiene código de barras",
            "se vende por peso"
        ];
        
        commonPhrases.forEach(phrase => {
             cleanValue = cleanValue.replace(phrase, '').trim();
        });

        // If empty after cleaning (just captured the question), ignore
        if (!cleanValue) return;

        stopListening(); // Stop listening while processing/speaking next question
        
        const speakNext = (text: string) => {
             speak(text, () => {
                resetTranscript();
                startListening();
             });
        };

        switch (currentStep) {
            case 'NAME':
                if (cleanValue.length > 2) {
                    setForm(prev => ({ ...prev, name: value.replace(/¿.*?\?/g, '').trim() })); 
                    setStep('DESCRIPTION');
                    speakNext(`¿Alguna descripción del producto? Di "No" para saltar.`);
                } else {
                    speakNext("No escuché bien. ¿Cuál es el nombre?");
                }
                break;
            case 'DESCRIPTION':
                if (cleanValue.includes('no') || cleanValue.includes('saltar') || cleanValue.includes('ninguna')) {
                    setForm(prev => ({ ...prev, description: '' }));
                } else {
                    setForm(prev => ({ ...prev, description: value.replace(/¿.*?\?/g, '').trim() }));
                }
                setStep('CATEGORY');
                speakNext(`¿A qué categoría pertenece? Ej. Abarrotes, Bebidas...`);
                break;
            case 'CATEGORY':
                if (cleanValue.length > 2) {
                    setForm(prev => ({ ...prev, category: value.replace(/¿.*?\?/g, '').trim() }));
                    setStep('PRICE');
                    speakNext(`¿Cuál es el precio de venta?`);
                } else {
                    speakNext("Por favor repite la categoría.");
                }
                break;
            case 'PRICE':
                const price = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
                if (!isNaN(price) && price > 0) {
                    setForm(prev => ({ ...prev, price }));
                    setStep('COST');
                    speakNext(`¿Cuál es el costo de compra?`);
                } else {
                    speakNext("No entendí el precio. Repítelo por favor.");
                }
                break;
            case 'COST':
                const cost = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
                if (!isNaN(cost)) {
                    setForm(prev => ({ ...prev, cost }));
                    setStep('STOCK');
                    speakNext(`¿Qué cantidad tienes en stock?`);
                } else {
                    speakNext("No entendí el costo. Repítelo por favor.");
                }
                break;
            case 'STOCK':
                 const stock = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
                if (!isNaN(stock)) {
                    setForm(prev => ({ ...prev, stock }));
                    setStep('MIN_STOCK');
                    speakNext(`¿Cuál es el stock mínimo para alertas?`);
                } else {
                    speakNext("No entendí la cantidad. Repítelo por favor.");
                }
                break;
            case 'MIN_STOCK':
                const minStock = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
               if (!isNaN(minStock)) {
                   setForm(prev => ({ ...prev, min_stock: minStock }));
                   setStep('BARCODE');
                   speakNext(`¿Tiene código de barras? Díctalo o di "No".`);
               } else {
                   speakNext("No entendí el mínimo. Repítelo por favor.");
               }
               break;
            case 'BARCODE':
                if (cleanValue.includes('no') || cleanValue.includes('saltar') || cleanValue.length < 3) {
                     setForm(prev => ({ ...prev, barcode: '' }));
                     setStep('WEIGHTED');
                     speakNext(`¿Se vende por peso? Di Sí o No.`);
                } else {
                     // Try to capture alphanumeric
                     const code = cleanValue.replace(/\s+/g, '').toUpperCase();
                     setForm(prev => ({ ...prev, barcode: code }));
                     setStep('WEIGHTED');
                     speakNext(`¿Se vende por peso? Di Sí o No.`);
                }
                break;
            case 'WEIGHTED':
                if (cleanValue.includes('sí') || cleanValue.includes('si') || cleanValue.includes('claro')) {
                    setForm(prev => ({ ...prev, is_weighted: true, measurement_unit: 'kg' }));
                    setStep('BATCH');
                    speakNext(`¿Controlar por lotes o caducidad? Di Sí o No.`);
                } else if (cleanValue.includes('no')) {
                     setForm(prev => ({ ...prev, is_weighted: false, measurement_unit: 'pz' }));
                     setStep('BATCH');
                     speakNext(`¿Controlar por lotes o caducidad? Di Sí o No.`);
                } else {
                     speakNext("Di Sí o No. ¿Es por peso?");
                }
                break;
            case 'BATCH':
                if (cleanValue.includes('sí') || cleanValue.includes('si')) {
                    setForm(prev => ({ ...prev, is_batch_tracked: true }));
                } else {
                    setForm(prev => ({ ...prev, is_batch_tracked: false }));
                }
                setStep('CONFIRM');
                speakNext(`Resumen: ${form.name},  ${form.price} pesos. ¿Guardar?`);
                break;
            case 'CONFIRM':
                if (cleanValue.includes('sí') || cleanValue.includes('si') || cleanValue.includes('guardar') || cleanValue.includes('ok')) {
                    handleSave();
                } else if (cleanValue.includes('cancelar') || cleanValue.includes('no')) {
                    handleClear();
                    speak("Cancelado. ¿Quieres empezar de nuevo?", () => {});
                } else {
                    speakNext("¿Guardar el producto?");
                }
                break;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (transcript && !interimTranscript && transcript !== lastProcessedTranscript) {
               nextStep(step, transcript);
            }
        }, 1500); // reduced wait time slightly

        return () => clearTimeout(timer);
    }, [transcript, interimTranscript, step]);


    const handleSave = async () => {
        try {
            const finalSku = form.barcode || form.sku || `SKU-${Date.now()}`;
            
            const productToSave = {
                ...form,
                name: form.name,
                description: form.description || '',
                price: Number(form.price),
                cost: Number(form.cost || 0),
                min_stock: Number(form.min_stock || 0),
                sku: finalSku,
                barcode: form.barcode || undefined,
                stock: Number(form.stock || 0),
                is_active: true,
                category: form.category || 'General',
                is_weighted: form.is_weighted || false,
                is_batch_tracked: form.is_batch_tracked || false,
                measurement_unit: form.is_weighted ? 'kg' : 'pz'
            };

            await addProduct(productToSave as any);

            setLastSavedProduct(productToSave);
            speak("Producto guardado correctamente.");
            handleClear(false); // Don't wipe 'lastSavedProduct'
            setStep('SUCCESS');
            
            // After success view, go back to IDLE after a few seconds or let them click
            setTimeout(() => setStep('IDLE'), 4000);

        } catch (err) {
            console.error(err);
            speak("Error al guardar.");
        }
    };

    const handleClear = (fullReset = true) => {
        setStep('IDLE');
        if (fullReset) setLastSavedProduct(null);
        resetTranscript();
        setLastProcessedTranscript('');
        setForm({
            name: '',
            description: '',
            price: 0,
            cost: 0,
            stock: 0,
            sku: '',
            barcode: '',
            min_stock: 5,
            category: '',
            is_weighted: false,
            is_batch_tracked: false,
            measurement_unit: 'pz'
        });
        stopSpeaking();
        stopListening();
    };

    // UI Helper to highlight active field
    const Field = ({ label, value, active, icon: Icon }: { label: string, value: any, active: boolean, icon: any }) => (
        <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${active ? 'border-blue-500 bg-blue-50 scale-105 shadow-md' : 'border-gray-100 bg-white opacity-60'}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-blue-800' : 'text-gray-400'}`}>{label}</span>
            </div>
            <div className={`text-lg font-medium truncate ${active ? 'text-gray-900' : 'text-gray-500'}`}>
                {value || '-'}
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Inventario de Voz
                </h2>
                
                {step === 'SUCCESS' && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl animate-bounce">
                        ¡Producto Agregado Exitosamente!
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Voice Interaction */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {step === 'IDLE' || step === 'SUCCESS' ? (
                            <button
                                onClick={startInteraction}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-3 w-full justify-center"
                            >
                                <Play className="w-6 h-6" /> {step === 'SUCCESS' ? 'Nuevo Registro' : 'Iniciar'}
                            </button>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`
                                        relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isListening 
                                            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-8 ring-red-100' 
                                            : 'bg-green-600 hover:bg-green-700 shadow-xl'
                                        }
                                    `}
                                >
                                    <Mic className="w-12 h-12 text-white" />
                                </button>
                                <div className="absolute -bottom-16 w-max left-1/2 -translate-x-1/2 text-sm font-bold text-gray-500">
                                    {isListening ? 'Escuchando...' : 'Procesando...'}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-20 w-full p-4 bg-gray-50 rounded-xl text-center min-h-[120px] flex flex-col justify-center border-2 border-dashed border-gray-200">
                             <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest font-bold">Transcripción</p>
                             <p className="text-lg font-medium text-gray-800 italic">
                                "{transcript || interimTranscript || '...'}"
                             </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Form Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field icon={Tag} label="Producto" value={form.name} active={step === 'NAME'} />
                        <Field icon={Tag} label="Descripción" value={form.description} active={step === 'DESCRIPTION'} />
                        <Field icon={Package} label="Categoría" value={form.category} active={step === 'CATEGORY'} />
                        <Field icon={DollarSign} label="Precio Venta" value={`$${form.price}`} active={step === 'PRICE'} />
                        
                        <Field icon={DollarSign} label="Costo Compra" value={`$${form.cost}`} active={step === 'COST'} />
                        <Field icon={Package} label="Stock Actual" value={form.stock} active={step === 'STOCK'} />
                        <Field icon={AlertTriangle} label="Min Stock" value={form.min_stock} active={step === 'MIN_STOCK'} />
                        
                        <Field icon={Barcode} label="Código Barras" value={form.barcode} active={step === 'BARCODE'} />
                        <Field icon={Scale} label="Por Peso" value={form.is_weighted ? 'Sí' : 'No'} active={step === 'WEIGHTED'} />
                        <Field icon={Package} label="Lotes/Caducidad" value={form.is_batch_tracked ? 'Sí' : 'No'} active={step === 'BATCH'} />
                        <div className={`p-4 rounded-xl border-2 flex items-center justify-center ${step === 'CONFIRM' ? 'border-green-500 bg-green-50' : 'border-gray-100 opacity-60'}`}>
                             <span className="font-bold text-green-700">CONFIRMAR</span>
                        </div>
                    </div>

                    {/* Live Summary / Last Saved */}
                    {lastSavedProduct && step === 'SUCCESS' && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="opacity-80 text-sm font-medium mb-1">Último producto guardado</p>
                                    <h3 className="text-2xl font-bold">{lastSavedProduct.name}</h3>
                                    <p className="mt-1 opacity-90">{lastSavedProduct.category} • {lastSavedProduct.stock} unidades</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">${lastSavedProduct.price}</p>
                                    <p className="opacity-80 text-sm">Margen: {Math.round((((Number(lastSavedProduct.price) || 0) - (Number(lastSavedProduct.cost) || 0)) / (Number(lastSavedProduct.cost) || 1)) * 100)}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                 
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => nextStep(step, transcript)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-sm font-bold">
                            Saltar / Forzar
                        </button>
                        <button onClick={() => handleClear(true)} className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold">
                            Cancelar Todo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
