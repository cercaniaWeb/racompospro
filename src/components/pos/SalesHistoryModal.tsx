import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useModal } from '@/hooks/useModal';
import { X, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { printTicket } from '@/utils/printTicket';
import TicketPreviewModal from './TicketPreviewModal';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';

interface SalesHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({ isOpen, onClose }) => {
    const [showPreview, setShowPreview] = React.useState(false);
    const [selectedSale, setSelectedSale] = React.useState<{ sale: any, items: any[] } | null>(null);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    const { ticketConfig } = useSettingsStore();
    const { user } = useAuthStore();

    const sales = useLiveQuery(async () => {
        if (!isOpen) return [];
        // Get sales from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await db.sales
            .where('created_at')
            .aboveOrEqual(today)
            .reverse()
            .sortBy('created_at');
    }, [isOpen]);

    const handleReprint = async (sale: any) => {
        const items = await db.saleItems.where('sale_id').equals(sale.id).toArray();
        setSelectedSale({ sale, items });
        setShowPreview(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
            <div ref={modalRef} className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Printer className="text-blue-400" size={24} />
                        Historial de Ventas (Hoy)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!sales || sales.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No hay ventas registradas hoy.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-sm border-b border-gray-800">
                                        <th className="p-3 font-medium">Hora</th>
                                        <th className="p-3 font-medium">Ticket</th>
                                        <th className="p-3 font-medium">Método</th>
                                        <th className="p-3 font-medium text-right">Total</th>
                                        <th className="p-3 font-medium text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                            <td className="p-3 text-gray-300">
                                                {format(new Date(sale.created_at), 'HH:mm', { locale: es })}
                                            </td>
                                            <td className="p-3 text-gray-300 font-mono">
                                                {sale.transaction_id.slice(-8)}
                                            </td>
                                            <td className="p-3 text-gray-300 capitalize">
                                                {sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                                            </td>
                                            <td className="p-3 text-white font-bold text-right">
                                                ${sale.total_amount.toFixed(2)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleReprint(sale)}
                                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                                                    title="Reimprimir Ticket"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <TicketPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                sale={selectedSale?.sale}
                items={selectedSale?.items || []}
                config={ticketConfig}
                user={user || undefined}
            />
        </div>
    );
};

export default SalesHistoryModal;
