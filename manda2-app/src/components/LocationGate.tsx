'use client';
import React, { useState, useEffect } from 'react';
import { Truck, Store as StoreIcon, ChevronRight, Locate, Loader2 } from 'lucide-react';
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
        <div className="fixed inset-0 bg-gradient-to-br from-[#0f4c3a] to-[#022c22] z-50 flex flex-col p-6 text-white overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-[#10b981]/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-[#059669]/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center relative z-10 max-w-sm mx-auto w-full">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                        manda2
                    </h1>
                    <p className="text-emerald-100/80 text-lg font-medium">Tu súper fresco, en minutos.</p>
                </div>

                {/* Switcher */}
                <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-2xl mb-8 border border-white/10">
                    <button
                        onClick={() => { setMode('delivery'); setSelectedLocation(''); }}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${mode === 'delivery' ? 'bg-white text-emerald-900 shadow-lg' : 'text-emerald-100/60 hover:text-white'}`}
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        A Domicilio
                    </button>
                    <button
                        onClick={() => { setMode('pickup'); setSelectedLocation(''); }}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${mode === 'pickup' ? 'bg-white text-emerald-900 shadow-lg' : 'text-emerald-100/60 hover:text-white'}`}
                    >
                        <StoreIcon className="w-4 h-4 mr-2" />
                        Pick Up
                    </button>
                </div>

                {/* Content Area */}
                <div className="glass-panel rounded-3xl p-6 animate-in slide-in-from-bottom-4 duration-500">
                    {mode === 'delivery' ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-emerald-900 mb-1">¿Dónde te encuentras?</label>

                            <button
                                onClick={handleUseLocation}
                                disabled={locating}
                                className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-100"
                            >
                                {locating ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Locate className="w-5 h-5 mr-2" />}
                                {locating ? 'Ubicando...' : 'Usar ubicación actual'}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">O ingresa manualmente</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <input
                                type="text"
                                className="w-full p-4 bg-white border border-gray-200 rounded-xl font-medium text-emerald-950 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                placeholder="Calle, número, colonia..."
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-emerald-900 mb-1">Elige tu sucursal</label>
                            <div className="relative">
                                <select
                                    className="w-full p-4 bg-white border border-gray-200 rounded-xl font-medium text-emerald-950 appearance-none outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    disabled={loadingStores}
                                >
                                    <option value="">{loadingStores ? 'Cargando...' : 'Selecciona una tienda...'}</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 text-emerald-900 pointer-events-none" />
                            </div>
                            {selectedLocation && (
                                <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex gap-2">
                                    <StoreIcon size={16} />
                                    <span>Tu pedido estará listo en 20-30 min.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 max-w-sm mx-auto w-full mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedLocation}
                    className="w-full bg-white text-emerald-900 py-4 rounded-xl font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {mode === 'delivery' ? 'Confirmar Dirección' : 'Confirmar Tienda'}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};
