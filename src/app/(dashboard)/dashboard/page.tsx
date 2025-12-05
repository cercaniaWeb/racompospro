'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/routes';

import ExpiryAlerts from '@/components/organisms/ExpiryAlerts';
import SmartReorderWidget from '@/components/widgets/SmartReorderWidget';
import {
    ShoppingCart, Package, Users, FileText,
    DollarSign, UserCog, Settings, TrendingUp,
    ArrowRightLeft, PackageSearch, Store
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user: authUser } = useAuthStore();
    const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState<string>('');


    const quickAccessCards = [
        {
            title: 'POS Terminal',
            description: 'Procesa ventas y gestiona carritos',
            icon: <ShoppingCart className="h-8 w-8 text-primary" />,
            href: ROUTES.POS,
            color: 'from-violet-500/20 to-purple-500/20'
        },
        {
            title: 'Productos',
            description: 'Administra tu catálogo',
            icon: <Package className="h-8 w-8 text-blue-400" />,
            href: ROUTES.PRODUCTS,
            color: 'from-blue-500/20 to-cyan-500/20'
        },
        {
            title: 'Inventario',
            description: 'Control de stock y transferencias',
            icon: <PackageSearch className="h-8 w-8 text-green-400" />,
            href: ROUTES.INVENTORY,
            color: 'from-green-500/20 to-emerald-500/20'
        },
        {
            title: 'Transferencias',
            description: 'Gestiona movimientos entre tiendas',
            icon: <ArrowRightLeft className="h-8 w-8 text-orange-400" />,
            href: ROUTES.INVENTORY_TRANSFERS,
            color: 'from-orange-500/20 to-amber-500/20'
        },
        {
            title: 'Clientes',
            description: 'Base de datos de clientes',
            icon: <Users className="h-8 w-8 text-pink-400" />,
            href: ROUTES.CUSTOMERS,
            color: 'from-pink-500/20 to-rose-500/20'
        },
        {
            title: 'Reportes',
            description: 'Análisis y estadísticas',
            icon: <FileText className="h-8 w-8 text-indigo-400" />,
            href: ROUTES.REPORTS,
            color: 'from-indigo-500/20 to-purple-500/20'
        },
        {
            title: 'Gastos y Compras',
            description: 'Control financiero',
            icon: <DollarSign className="h-8 w-8 text-yellow-400" />,
            href: ROUTES.EXPENSES,
            color: 'from-yellow-500/20 to-orange-500/20'
        },
        {
            title: 'Usuarios',
            description: 'Gestión de personal',
            icon: <UserCog className="h-8 w-8 text-teal-400" />,
            href: ROUTES.USERS,
            color: 'from-teal-500/20 to-cyan-500/20'
        },
        {
            title: 'Configuración',
            description: 'Ajustes del sistema',
            icon: <Settings className="h-8 w-8 text-gray-400" />,
            href: ROUTES.SETTINGS,
            color: 'from-gray-500/20 to-slate-500/20'
        },
    ];



    useEffect(() => {
        const fetchUserStore = async () => {
            if (!authUser?.id) return;

            // First try localStorage (for performance)
            let storeId = localStorage.getItem('current_store_id');

            // If not in localStorage, fetch from Supabase
            if (!storeId) {
                try {
                    const { supabase } = await import('@/lib/supabase/client');
                    const { data, error } = await supabase
                        .from('user_stores')
                        .select('store_id')
                        .eq('user_id', authUser.id)
                        .maybeSingle(); // Use maybeSingle instead of single to avoid error if no rows

                    if (data?.store_id) {
                        storeId = data.store_id;
                        // Save to localStorage for next time
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('current_store_id', storeId as string);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user store:', error);
                }
            }

            setCurrentStoreId(storeId);

            // Fetch store name from Supabase
            if (storeId) {
                try {
                    const { supabase } = await import('@/lib/supabase/client');
                    const { data: store } = await supabase
                        .from('stores')
                        .select('name')
                        .eq('id', storeId)
                        .single();

                    setStoreName(store?.name || 'Tienda Desconocida');
                } catch (error) {
                    console.error('Error fetching store name:', error);
                    setStoreName('Sin Tienda');
                }
            } else {
                setStoreName('Sin Tienda');
            }
        };

        fetchUserStore();
    }, [authUser?.id]);

    return (
        <div className="space-y-8">
            {/* Welcome Section with Store Info */}
            <div className="glass rounded-2xl p-8 border border-white/10">
                <h1 className="text-4xl font-bold text-gradient mb-2">
                    Bienvenido, {authUser?.name?.split(' ')[0] || 'Usuario'}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground text-lg">
                    <Store className="h-5 w-5 text-blue-400" />
                    <span>Operando en: <span className="text-blue-400 font-medium">{storeName}</span></span>
                </div>
            </div>

            {/* Expiry Alerts */}
            {currentStoreId && (
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Alertas de Caducidad</h2>
                    <ExpiryAlerts storeId={currentStoreId} />
                </div>
            )}

            {/* Smart Reordering Widget */}
            {currentStoreId && (
                <div className="mt-8">
                    <SmartReorderWidget storeId={currentStoreId} maxItems={3} />
                </div>
            )}

            {/* Quick Access Grid */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickAccessCards.map((card, index) => (
                        <button
                            key={index}
                            onClick={() => router.push(card.href)}
                            className="glass rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group text-left hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                        >
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats - Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Ventas Hoy</h3>
                        <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">$0.00</p>
                    <p className="text-xs text-muted-foreground mt-2">+0% vs ayer</p>
                </div>

                <div className="glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Productos Activos</h3>
                        <Package className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground mt-2">En catálogo</p>
                </div>

                <div className="glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Clientes Total</h3>
                        <Users className="h-5 w-5 text-pink-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground mt-2">Registrados</p>
                </div>
            </div>
        </div>
    );
}
