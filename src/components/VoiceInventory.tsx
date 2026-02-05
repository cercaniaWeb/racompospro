import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
        handleClear(true);
        speak("¿Cuál es el nombre del producto?", () => {
            // Echo cancellation delay
            setTimeout(() => {
                resetTranscript();
            }, 2000);
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
                // Wait for the echo to clear
                setTimeout(() => {
                    resetTranscript();
                }, 2000);
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
                    speak("Cancelado. ¿Quieres empezar de nuevo?", () => { });
                } else {
                    speakNext("¿Guardar el producto?");
                }
                break;
        }
    };

    // Handle manual processing after PTT release
    const handlePTTRelease = () => {
        stopListening();
        // Use a small delay to ensure the final transcript is captured
        setTimeout(() => {
            if (transcript && transcript !== lastProcessedTranscript) {
                setLastProcessedTranscript(transcript);
                nextStep(step, transcript);
            }
        }, 500);
    };

    // Auto-advance timer (Disabled by default for PTT, but kept as helper if needed)
    /*
    useEffect(() => {
        const timer = setTimeout(() => {
            if (transcript && !interimTranscript && transcript !== lastProcessedTranscript && isListening) {
                setLastProcessedTranscript(transcript);
                nextStep(step, transcript);
            }
        }, 2500); 

        return () => clearTimeout(timer);
    }, [transcript, interimTranscript, step, isListening]);
    */


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
        <div className={`p-4 rounded-xl border transition-all duration-500 transform ${active
            ? 'border-primary bg-primary/20 scale-105 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] ring-1 ring-primary/50 backdrop-blur-md'
            : 'glass border-white/5 opacity-70 hover:opacity-100'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            <div className={`text-lg font-medium truncate ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {isImage && value ? (
                    <div className="flex items-center gap-2 text-primary">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-semibold">Imagen Generada</span>
                    </div>
                ) : (
                    value || <span className="text-muted-foreground/30 italic text-sm">Esperando...</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-4rem)] p-6 flex flex-col items-center">

            <div className="w-full max-w-6xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <h2 className="text-5xl font-black text-gradient transform hover:scale-105 transition-transform duration-300 tracking-tight">
                        Asistente de Inventario
                    </h2>
                    <p className="text-muted-foreground font-medium">Registro de productos manos libres</p>

                    {step === 'SUCCESS' && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-green-500/10 border border-green-500/30 text-green-400 py-3 px-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-bounce flex items-center justify-center gap-2 font-bold z-10 backdrop-blur-xl">
                            <Check className="w-6 h-6" />
                            ¡Producto Guardado Exitosamente!
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 mt-12">
                    {/* Left Column: Voice Interaction Hub */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="flex-1 glass rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                            {/* Decorative background blobs */}
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob ${isListening ? 'animation-delay-2000' : ''}`}></div>
                            <div className={`absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob ${isListening ? 'animation-delay-4000' : ''}`}></div>

                            {step === 'IDLE' || step === 'SUCCESS' ? (
                                <button
                                    onClick={startInteraction}
                                    className="relative z-10 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-8 rounded-2xl text-xl font-bold shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 min-h-[80px]"
                                    aria-label={step === 'SUCCESS' ? 'Iniciar nuevo registro de producto' : 'Iniciar asistente de inventario'}
                                >
                                    <Play className="w-8 h-8 fill-current" />
                                    {step === 'SUCCESS' ? 'Nuevo Registro' : 'Iniciar'}
                                </button>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center">
                                    <button
                                        onMouseDown={startListening}
                                        onMouseUp={handlePTTRelease}
                                        onTouchStart={(e) => { e.preventDefault(); startListening(); }}
                                        onTouchEnd={(e) => { e.preventDefault(); handlePTTRelease(); }}
                                        className={`
                                            relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer
                                            ${isListening
                                                ? 'bg-destructive shadow-[0_0_60px_-10px_rgba(239,68,68,0.5)] scale-110'
                                                : 'bg-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] hover:scale-105'
                                            }
                                        `}
                                        aria-label="Mantener para hablar"
                                    >
                                        <div className={`absolute inset-0 rounded-full border-4 border-white/20 ${isListening ? 'animate-ping' : ''}`}></div>
                                        <Mic className={`w-20 h-20 text-white transition-transform ${isListening ? 'scale-110' : ''}`} />
                                    </button>

                                    <div className="mt-8 text-center space-y-2">
                                        <div className="inline-flex flex-col items-center gap-2">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-border text-foreground text-sm font-medium backdrop-blur-sm">
                                                {isListening ? (
                                                    <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></span> Grabando...</>
                                                ) : (
                                                    <><span className="w-2 h-2 rounded-full bg-primary/50"></span> Mantenga para hablar</>
                                                )}
                                            </div>
                                            {isListening && <p className="text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse">Suelte para procesar</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 w-full">
                                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 min-h-[140px] flex flex-col justify-center text-center relative backdrop-blur-sm">
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transcripción</div>
                                    <p className="text-xl font-medium text-foreground leading-relaxed">
                                        &quot;{transcript || interimTranscript || <span className="text-muted-foreground/30">...</span>}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => nextStep(step, transcript)}
                                className="p-6 glass glass-hover rounded-2xl text-gray-300 font-bold text-sm flex items-center justify-center gap-2 min-h-[64px]"
                                aria-label="Saltar al siguiente paso"
                            >
                                <span>⏭️</span> Saltar
                            </button>
                            <button
                                onClick={() => handleClear(true)}
                                className="p-6 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-2xl text-destructive font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[64px]"
                                aria-label="Cancelar registro actual"
                            >
                                <span>🗑️</span> Cancelar
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live Data Visualization */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="glass rounded-3xl p-8 h-full relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/20">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">
                                    Datos del Producto
                                </h3>
                                <div className="ml-auto text-sm text-muted-foreground font-medium">
                                    Paso: <span className="text-primary font-bold">{step}</span>
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
                                        p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 min-h-[100px]
                                    ${step === 'CONFIRM'
                                            ? 'border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)] scale-105 hover:bg-green-500/20'
                                            : 'border-dashed border-border text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-foreground'
                                        }
                                    `}
                                    aria-label="Confirmar y guardar producto"
                                >
                                    <Save className="w-8 h-8" />
                                    <span className="font-bold uppercase tracking-wider text-xs">Confirmar</span>
                                </button>
                            </div>

                            {/* Preview of Image if exists */}
                            {form.image_url && (
                                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4 animate-fade-in backdrop-blur-sm">
                                    <Image
                                        src={form.image_url}
                                        alt="Preview"
                                        width={64}
                                        height={64}
                                        className="rounded-xl object-cover shadow-lg"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-primary">Vista Previa Generada</p>
                                        <p className="text-xs text-muted-foreground opacity-80">Esta imagen se asignará al producto.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Last Saved Card */}
                        {lastSavedProduct && step === 'SUCCESS' && (
                            <div className="glass border-green-500/30 rounded-3xl p-8 text-foreground shadow-2xl animate-fade-in-up transform transition-all hover:scale-[1.02] backdrop-blur-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-green-500">
                                            <Check className="w-4 h-4" />
                                            Guardado Recientemente
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight">{lastSavedProduct.name}</h3>
                                        <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
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
                                        <p className="text-4xl font-black text-green-500">${lastSavedProduct.price}</p>
                                        <p className="text-muted-foreground text-sm font-medium">Precio Venta</p>
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
