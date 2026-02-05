'use client';
import React, { useState, useEffect } from 'react';
import { Truck, Store as StoreIcon, ChevronRight, Locate, Loader2, Package } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Store } from '@/lib/types';

interface LocationGateProps {
    onComplete: (mode: 'delivery' | 'pickup', location: string) => void;
}

export const LocationGate: React.FC<LocationGateProps> = ({ onComplete }) => {
    const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [loadingStores, setLoadingStores] = useState(false);
    const [locating, setLocating] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchStores = async () => {
            setLoadingStores(true);
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('is_active', true);

            if (data) setStores(data);
            setLoadingStores(false);
        };
        fetchStores();
    }, []);

    const handleUseLocation = () => {
        setLocating(true);
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización');
            setLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.address) {
                        const { road, house_number, suburb, city, town, village } = data.address;
                        const street = road || '';
                        const number = house_number ? ` #${house_number}` : '';
                        // const area = suburb ? `, ${suburb}` : ''; // Simplified for cleaner UI
                        const locality = city || town || village || '';
                        const shortAddress = `${street}${number}, ${locality}`;
                        setSelectedLocation(shortAddress.replace(/^, /, '').trim() || data.display_name);
                    } else if (data && data.display_name) {
                        setSelectedLocation(data.display_name);
                    } else {
                        setSelectedLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                } catch (error) {
                    setSelectedLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } finally {
                    setLocating(false);
                }
            },
            (error) => {
                console.error(error);
                alert('No pudimos obtener tu ubicación.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = () => {
        if (selectedLocation) {
            onComplete(mode, selectedLocation);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col p-8 text-white overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[70%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center relative z-10 max-w-sm mx-auto w-full">
                <div className="mb-14 text-center">
                    <div className="inline-block p-4 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 mb-6 backdrop-blur-xl">
                        <Package size={48} className="text-emerald-400" />
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter mb-3 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                        manda2
                    </h1>
                    <p className="text-emerald-100/60 text-lg font-bold tracking-tight">Tu súper fresco, en minutos.</p>
                </div>

                {/* Switcher */}
                <div className="flex p-1.5 bg-white/5 backdrop-blur-3xl rounded-[2rem] mb-8 border border-white/10 shadow-2xl">
                    <button
                        onClick={() => { setMode('delivery'); setSelectedLocation(''); }}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center ${mode === 'delivery' ? 'bg-white text-slate-900 shadow-[0_10px_25px_rgba(255,255,255,0.2)]' : 'text-white/40 hover:text-white'}`}
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        Domicilio
                    </button>
                    <button
                        onClick={() => { setMode('pickup'); setSelectedLocation(''); }}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center ${mode === 'pickup' ? 'bg-white text-slate-900 shadow-[0_10px_25px_rgba(255,255,255,0.2)]' : 'text-white/40 hover:text-white'}`}
                    >
                        <StoreIcon className="w-4 h-4 mr-2" />
                        Pick Up
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
                    {mode === 'delivery' ? (
                        <div className="space-y-6">
                            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Tu Ubicación</label>

                            <button
                                onClick={handleUseLocation}
                                disabled={locating}
                                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                {locating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Locate className="w-4 h-4 mr-2" />}
                                {locating ? 'Ubicando...' : 'Ubicación Actual'}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] font-bold uppercase tracking-widest">O</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <input
                                type="text"
                                className="w-full p-5 bg-black/20 border border-white/10 rounded-2xl font-bold text-white placeholder:text-white/20 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all text-sm"
                                placeholder="Ingresa tu dirección..."
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Elige Sucursal</label>
                            <div className="relative">
                                <select
                                    className="w-full p-5 bg-black/20 border border-white/10 rounded-2xl font-bold text-white appearance-none outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all text-sm"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    disabled={loadingStores}
                                >
                                    <option value="" className="bg-slate-900">{loadingStores ? 'Cargando...' : 'Selecciona una tienda...'}</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.name} className="bg-slate-900">
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 transform -translate-y-1/2 rotate-90 text-emerald-400 pointer-events-none" size={18} />
                            </div>
                            {selectedLocation && (
                                <div className="p-4 bg-emerald-400/10 rounded-2xl border border-emerald-400/20 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                    <StoreIcon size={18} className="text-emerald-400" />
                                    <span className="text-xs text-emerald-100/70 font-medium">Listo para recolectar en 20-30 min.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 max-w-sm mx-auto w-full mt-10 mb-6">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedLocation}
                    className="w-full bg-white text-slate-900 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    CONTINUAR
                    <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>

        </div>
    );
};
