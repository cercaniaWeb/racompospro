import React, { useEffect, useState, useRef } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/lib/supabase/types';
import { Mic, MicOff, Save, RotateCcw, Check, AlertTriangle, Play, Pause, Package, Barcode, DollarSign, Tag, Scale, Image as ImageIcon, Sparkles } from 'lucide-react';

type InteractionStep = 'IDLE' | 'NAME' | 'DESCRIPTION' | 'CATEGORY' | 'PRICE' | 'COST' | 'STOCK' | 'MIN_STOCK' | 'BARCODE' | 'WEIGHTED' | 'BATCH' | 'IMAGE_GEN' | 'CONFIRM' | 'SUCCESS';

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
        image_url: '',
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
            "alguna descripción del producto",
            "di no para saltar",
            "a qué categoría pertenece",
            "cuál es el precio de venta", 
            "cuál es el costo de compra",
            "qué cantidad tienes en stock",
            "cuál es el stock mínimo",
            "tiene código de barras",
            "se vende por peso",
            "controlar por lotes o caducidad",
            "generar imagen automática"
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

        const generatePlaceholderImage = (name: string) => {
            return `https://placehold.co/400x400/e2e8f0/1e293b?text=${encodeURIComponent(name.substring(0, 20))}`;
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
                
                setStep('IMAGE_GEN');
                speakNext(`¿Generar imagen automática para el producto? Di Sí o No.`);
                break;
            case 'IMAGE_GEN':
                if (cleanValue.includes('sí') || cleanValue.includes('si')) {
                    const imgUrl = generatePlaceholderImage(form.name || 'Producto');
                    setForm(prev => ({ ...prev, image_url: imgUrl }));
                    setStep('CONFIRM');
                    speakNext(`Resumen: ${form.name},  ${form.price} pesos. ¿Guardar?`);
                } else {
                     setForm(prev => ({ ...prev, image_url: '' }));
                     setStep('CONFIRM');
                     speakNext(`Resumen: ${form.name},  ${form.price} pesos. ¿Guardar?`);
                }
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
                image_url: form.image_url || undefined,
                measurement_unit: form.is_weighted ? 'kg' : 'pz'
            };

            await addProduct(productToSave as any);

            setLastSavedProduct(productToSave);
            speak("Producto guardado correctamente.");
            handleClear(false); // Don't wipe 'lastSavedProduct'
            setStep('SUCCESS');
            
            // After success view, go back to IDLE after a few seconds or let them click
            setTimeout(() => setStep('IDLE'), 5000);

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
            image_url: '',
            is_weighted: false,
            is_batch_tracked: false,
            measurement_unit: 'pz'
        });
        stopSpeaking();
        stopListening();
    };

    // UI Helper to highlight active field
    const Field = ({ label, value, active, icon: Icon, isImage = false }: { label: string, value: any, active: boolean, icon: any, isImage?: boolean }) => (
        <div className={`p-4 rounded-xl border-2 transition-all duration-500 transform ${
            active 
                ? 'border-indigo-500 bg-indigo-50/90 scale-105 shadow-xl ring-2 ring-indigo-200 backdrop-blur-md' 
                : 'border-white/20 bg-white/40 opacity-70 hover:opacity-100 hover:bg-white/60'
        }`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${active ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-indigo-800' : 'text-gray-600'}`}>{label}</span>
            </div>
            <div className={`text-lg font-medium truncate ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                {isImage && value ? (
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Imagen Generada</span>
                    </div>
                ) : (
                    value || <span className="text-gray-400 italic text-sm">Esperando...</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center">
            
            <div className="w-full max-w-6xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300">
                        Asistente de Inventario
                    </h2>
                    <p className="text-gray-500 font-medium">Registro de productos manos libres</p>
                    
                    {step === 'SUCCESS' && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-md bg-green-500 text-white py-3 px-6 rounded-2xl shadow-lg animate-bounce flex items-center justify-center gap-2 font-bold z-10">
                            <Check className="w-6 h-6" />
                            ¡Producto Guardado Exitosamente!
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 mt-12">
                    {/* Left Column: Voice Interaction Hub */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                           {/* Decorative background blobs */}
                           <div className={`absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob ${isListening ? 'animation-delay-2000' : ''}`}></div>
                           <div className={`absolute bottom-0 left-0 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob ${isListening ? 'animation-delay-4000' : ''}`}></div>

                            {step === 'IDLE' || step === 'SUCCESS' ? (
                                <button
                                    onClick={startInteraction}
                                    className="relative z-10 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 rounded-2xl text-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Play className="w-8 h-8" />
                                    {step === 'SUCCESS' ? 'Nuevo Registro' : 'Iniciar Conversación'}
                                </button>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center">
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`
                                            relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500
                                            ${isListening 
                                                ? 'bg-red-500 shadow-[0_0_60px_-10px_rgba(239,68,68,0.5)] scale-110' 
                                                : 'bg-indigo-600 shadow-xl'
                                            }
                                        `}
                                    >
                                        <div className={`absolute inset-0 rounded-full border-4 border-white opacity-20 ${isListening ? 'animate-ping' : ''}`}></div>
                                        <Mic className={`w-16 h-16 text-white transition-transform ${isListening ? 'scale-110' : ''}`} />
                                    </button>
                                    
                                    <div className="mt-8 text-center space-y-2">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium">
                                            {isListening ? (
                                                <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Escuchando...</>
                                            ) : (
                                                <><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Procesando...</>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Estado</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-8 w-full">
                                 <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 min-h-[140px] flex flex-col justify-center text-center relative">
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transcripción en vivo</div>
                                        <p className="text-xl font-medium text-gray-800 leading-relaxed">
                                            "{transcript || interimTranscript || <span className="text-gray-300">...</span>}"
                                        </p>
                                 </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => nextStep(step, transcript)} className="p-4 bg-white/60 hover:bg-white rounded-2xl text-gray-600 font-bold border border-white shadow-sm transition-all hover:shadow-md text-sm">
                                ⏭️ Saltar Paso
                             </button>
                             <button onClick={() => handleClear(true)} className="p-4 bg-red-50/50 hover:bg-red-50 rounded-2xl text-red-600 font-bold border border-red-100 shadow-sm transition-all hover:shadow-md text-sm">
                                🗑️ Cancelar
                             </button>
                        </div>
                    </div>

                    {/* Right Column: Live Data Visualization */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Datos del Producto
                                </h3>
                                <div className="ml-auto text-sm text-gray-500 font-medium">
                                    Paso: <span className="text-indigo-600 font-bold">{step}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <Field icon={Tag} label="Nombre" value={form.name} active={step === 'NAME'} />
                                <Field icon={Tag} label="Descripción" value={form.description} active={step === 'DESCRIPTION'} />
                                <Field icon={Package} label="Categoría" value={form.category} active={step === 'CATEGORY'} />
                                
                                <Field icon={DollarSign} label="Precio Venta" value={`$${form.price}`} active={step === 'PRICE'} />
                                <Field icon={DollarSign} label="Costo" value={`$${form.cost}`} active={step === 'COST'} />
                                <Field icon={Package} label="Stock" value={form.stock} active={step === 'STOCK'} />
                                
                                <Field icon={AlertTriangle} label="Min Stock" value={form.min_stock} active={step === 'MIN_STOCK'} />
                                <Field icon={Barcode} label="Código" value={form.barcode} active={step === 'BARCODE'} />
                                <Field icon={Scale} label="Por Peso" value={form.is_weighted ? 'Sí' : 'No'} active={step === 'WEIGHTED'} />
                                
                                <Field icon={Package} label="Lotes" value={form.is_batch_tracked ? 'Sí' : 'No'} active={step === 'BATCH'} />
                                <Field icon={ImageIcon} label="Imagen" value={form.image_url} active={step === 'IMAGE_GEN'} isImage />
                                
                                <button
                                    onClick={handleSave}
                                    className={`
                                        p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300
                                        ${step === 'CONFIRM' 
                                            ? 'border-green-500 bg-green-500 text-white shadow-lg scale-105 hover:bg-green-600' 
                                            : 'border-dashed border-gray-300 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600'
                                        }
                                    `}
                                >
                                    <Save className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-xs">Confirmar</span>
                                </button>
                            </div>

                            {/* Preview of Image if exists */}
                            {form.image_url && (
                                <div className="mt-8 p-4 bg-indigo-50 rounded-2xl flex items-center gap-4 animate-fade-in">
                                    <img src={form.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-md" />
                                    <div>
                                        <p className="text-sm font-bold text-indigo-900">Vista Previa Generada</p>
                                        <p className="text-xs text-indigo-700 opacity-80">Esta imagen se asignará al producto.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Last Saved Card */}
                        {lastSavedProduct && step === 'SUCCESS' && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl animate-fade-in-up transform transition-all hover:scale-[1.02]">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 opacity-90 text-sm font-bold uppercase tracking-wider">
                                            <Check className="w-4 h-4" />
                                            Guardado Recientemente
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight">{lastSavedProduct.name}</h3>
                                        <div className="flex items-center gap-4 text-emerald-100 text-sm font-medium">
                                            <span>{lastSavedProduct.category}</span>
                                            <span>•</span>
                                            <span>{lastSavedProduct.stock} unidades</span>
                                            {lastSavedProduct.is_weighted && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> Peso</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-black">${lastSavedProduct.price}</p>
                                        <p className="text-emerald-200 text-sm font-medium">Precio Venta</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
