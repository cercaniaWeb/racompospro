'use client';

import React, { useEffect, useState } from 'react';
import {
    User,
    Package,
    MapPin,
    ChevronLeft,
    History,
    ArrowRight,
    LogOut,
    ShoppingBag,
    Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProfileViewProps {
    user: any;
    onBack: () => void;
    onSignOut: () => void;
    onReorder: (items: any[]) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onSignOut, onReorder }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                // Buscamos por customer_name ya que vimos que es el campo usado en Manda2
                // Aunque idealmente sería por ID, nos adaptamos al esquema detectado
                const customerName = user.user_metadata?.full_name || user.email?.split('@')[0];

                const { data, error } = await supabase
                    .from('sales')
                    .select('*, sale_items(*, products(*))')
                    .eq('customer_name', customerName)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
                {/* User Info Card */}
                <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-2xl font-black shadow-inner border border-white/20">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight leading-tight">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                            </h2>
                            <p className="text-emerald-100/60 text-sm font-medium">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mis Pedidos Recientes</h3>
                        <History size={16} className="text-slate-300" />
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse"></div>
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-4 border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                <ShoppingBag size={32} />
                            </div>
                            <p className="font-bold text-slate-400 text-sm">Aún no has realizado pedidos</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">
                                                {format(new Date(order.created_at), "d MMMM, HH:mm", { locale: es })}
                                            </p>
                                            <p className="text-lg font-black text-slate-900">${order.total.toFixed(2)}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.fulfillment_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                order.fulfillment_status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                                    order.fulfillment_status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-slate-100 text-slate-500'
                                            }`}>
                                            {order.fulfillment_status === 'pending' ? 'Pendiente' :
                                                order.fulfillment_status === 'preparing' ? 'Cocinando' :
                                                    order.fulfillment_status === 'ready' ? 'Listo' : 'Entregado'}
                                        </div>
                                    </div>

                                    {/* Order Details (Address & Items) */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                                            <MapPin size={14} className="text-emerald-500" />
                                            <p className="text-[11px] font-bold line-clamp-1 italic">
                                                {order.delivery_type === 'pickup' ? 'Recoger en tienda' : (order.delivery_address || 'Sin dirección')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {order.sale_items?.slice(0, 3).map((item: any, idx: number) => (
                                                    <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                        {item.products?.image_url ? (
                                                            <img src={item.products.image_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                                                                <Package size={12} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {order.sale_items?.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 shadow-sm">
                                                        +{order.sale_items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">
                                                {order.sale_items?.length} productos
                                            </p>
                                        </div>
                                    </div>


                                    <button
                                        onClick={() => onReorder(order.sale_items)}
                                        className="w-full py-3 bg-slate-100 text-slate-600 group-hover:bg-emerald-900 group-hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        Pedir de nuevo
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Addresses Section */}
                <section className="space-y-4">

                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Direcciones Guardadas</h3>
                        <MapPin size={16} className="text-slate-300" />
                    </div>

                    <div className="space-y-3">
                        {/* Mock addresses for now or from metadata if available */}
                        {(user?.user_metadata?.addresses || [
                            { id: 1, label: 'Casa', icon: '🏠', address: 'Calle Principal #123, Centro' },
                            { id: 2, label: 'Oficina', icon: '🏢', address: 'Av. Tecnológico #456, Piso 5' }
                        ]).map((addr: any) => (
                            <button
                                key={addr.id}
                                onClick={() => { }} // TODO: Implement selection logic
                                className="w-full p-5 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-emerald-50 transition-colors">
                                        {addr.icon}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm tracking-tight">{addr.label}</p>
                                        <p className="text-xs font-medium text-slate-400 truncate max-w-[180px]">{addr.address}</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}

                        <button className="w-full p-4 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-all">
                            + Agregar nueva dirección
                        </button>
                    </div>
                </section>


                {/* Settings Section */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ajustes</h3>

                    <button
                        onClick={onSignOut}
                        className="w-full p-5 bg-white rounded-2xl border border-red-50 text-red-600 flex items-center gap-4 hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <div className="p-2 bg-red-100 rounded-xl">
                            <LogOut size={18} />
                        </div>
                        <span className="font-bold">Cerrar Sesión</span>
                    </button>
                </section>
            </div>
        </div>
    );
};
