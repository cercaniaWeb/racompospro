import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, Package, User } from 'lucide-react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { supabase } from '@/lib/supabase/client';
import { useNotifications } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface AgendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AgendarModal: React.FC<AgendarModalProps> = ({ isOpen, onClose }) => {
    const { notify } = useNotifications();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        supplier_name: '',
        products: '',
        amount: '',
        notes: '',
        visit_date: '',
        visit_time: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!formData.supplier_name || !formData.visit_date) {
            notify.error('Error', 'Nombre del proveedor y fecha son obligatorios');
            return;
        }

        setLoading(true);
        try {
            // Combine date and time (default to 08:00 if time is empty)
            const time = formData.visit_time || '08:00';
            const dateTime = new Date(`${formData.visit_date}T${time}:00`);

            const { error } = await supabase.from('supplier_visits').insert({
                supplier_name: formData.supplier_name,
                products: formData.products,
                amount: formData.amount ? parseFloat(formData.amount) : null,
                notes: formData.notes,
                visit_date: dateTime.toISOString(),
                status: 'pending',
                created_by: user?.id
            });

            if (error) throw error;

            notify.success('Éxito', 'Visita agendada correctamente');
            onClose();
            setFormData({
                supplier_name: '',
                products: '',
                amount: '',
                notes: '',
                visit_date: '',
                visit_time: ''
            });
        } catch (error: any) {
            console.error('Error scheduling visit:', error);
            notify.error('Error', 'No se pudo agendar la visita');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-primary" />
                        Agendar Visita de Proveedor
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Cerrar modal de agendar visita"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <InputField
                        id="supplier-name"
                        label="Proveedor"
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                        placeholder="Nombre del proveedor"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            id="visit-date"
                            label="Fecha"
                            type="date"
                            value={formData.visit_date}
                            onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                        />
                        <InputField
                            id="visit-time"
                            label="Hora (Opcional)"
                            type="time"
                            value={formData.visit_time}
                            onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
                            placeholder="08:00"
                        />
                    </div>

                    <div>
                        <label htmlFor="products-textarea" className="block text-sm font-medium text-gray-300 mb-1">Productos</label>
                        <textarea
                            id="products-textarea"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none min-h-[80px]"
                            placeholder="Lista de productos a entregar..."
                            value={formData.products}
                            onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                            aria-label="Lista de productos a entregar"
                        />
                    </div>

                    <InputField
                        id="payment-amount"
                        label="Monto a Pagar"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                    />

                    <div>
                        <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-300 mb-1">Observaciones</label>
                        <textarea
                            id="notes-textarea"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none min-h-[60px]"
                            placeholder="Notas adicionales..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            aria-label="Observaciones adicionales"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Guardando...' : 'Agendar Visita'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AgendarModal;
