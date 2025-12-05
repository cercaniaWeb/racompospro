'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Printer, Eye, Banknote } from 'lucide-react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { printTicket } from '@/utils/printTicket';
import { useSettingsStore } from '@/store/settingsStore';

const SalesPage = () => {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const { ticketConfig } = useSettingsStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const sales = useLiveQuery(async () => {
        let collection = db.sales.orderBy('created_at').reverse();

        if (filterDate) {
            const start = new Date(filterDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filterDate);
            end.setHours(23, 59, 59, 999);

            return await db.sales
                .where('created_at')
                .between(start, end)
                .reverse()
                .sortBy('created_at');
        }

        return await collection.toArray();
    }, [filterDate]);

    const filteredSales = sales?.filter(sale =>
        sale.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.payment_method && sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const handleReprint = async (sale: any) => {
        const items = await db.saleItems.where('sale_id').equals(sale.id).toArray();
        printTicket({
            sale,
            items,
            config: ticketConfig,
            user: user || undefined
        });
    };

    const sidebarItems = [
        { id: 'pos', label: 'Punto de Venta', href: '/pos' },
        { id: 'inventory', label: 'Inventario', href: '/inventory' },
        { id: 'products', label: 'Productos', href: '/products' },
        { id: 'sales', label: 'Ventas', href: '/sales', active: true },
        { id: 'reports', label: 'Reportes', href: '/reports' },
        { id: 'expenses', label: 'Gastos y Compras', href: '/expenses' },
        { id: 'customers', label: 'Clientes', href: '/customers' },
        { id: 'users', label: 'Usuarios', href: '/users' },
        { id: 'settings', label: 'Configuración', href: '/settings' },
    ];

    return (
            <div>
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Historial de Ventas</h1>
                        <p className="text-muted-foreground">Consulta y gestiona todas las transacciones</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Actions if needed */}
                    </div>
                </div>

                {/* Filters */}
                <div className="glass rounded-xl border border-white/10 shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por ID o método..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-end">
                            <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterDate(''); }}>
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="glass rounded-xl border border-white/10 shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-gray-300 text-sm">
                                    <th className="p-4 font-medium">Fecha/Hora</th>
                                    <th className="p-4 font-medium">ID Transacción</th>
                                    <th className="p-4 font-medium">Método</th>
                                    <th className="p-4 font-medium text-right">Subtotal</th>
                                    <th className="p-4 font-medium text-right">Descuento</th>
                                    <th className="p-4 font-medium text-right">Total</th>
                                    <th className="p-4 font-medium text-center">Estado</th>
                                    <th className="p-4 font-medium text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {!filteredSales || filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                            No se encontraron ventas.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-gray-300">
                                                {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </td>
                                            <td className="p-4 text-gray-300 font-mono">
                                                {sale.transaction_id}
                                            </td>
                                            <td className="p-4 text-gray-300 capitalize">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-300 text-right">
                                                ${sale.net_amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-red-400 text-right">
                                                {(sale.discount_amount || 0) > 0 ? `-${(sale.discount_amount || 0).toFixed(2)}` : '-'}
                                            </td>
                                            <td className="p-4 text-white font-bold text-right">
                                                ${sale.total_amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Completado
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleReprint(sale)}
                                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                                                    title="Reimprimir Ticket"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
};

export default SalesPage;
