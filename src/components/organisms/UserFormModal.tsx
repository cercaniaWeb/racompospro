import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { User } from '@/lib/supabase/types';
import { useStores } from '@/hooks/useStores';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    user?: User | null;
    mode: 'add' | 'edit';
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, user, mode }) => {
    const { stores, loading: storesLoading } = useStores();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'cajera' as 'admin' | 'gerente' | 'cajera' | 'dev' | 'staff',
        status: 'pending' as 'active' | 'inactive' | 'pending',
        store_id: '' as string | undefined
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    useEffect(() => {
        if (user && mode === 'edit') {
            const normalizeRole = (r: string) => {
                if (r === 'cajero') return 'cajera';
                if (r === 'grte') return 'gerente';
                return r;
            };

            setFormData({
                name: user.name,
                email: user.email,
                role: normalizeRole(user.role as string) as any,
                status: user.status,
                store_id: (user as any).store_id || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'cajera',
                status: 'pending',
                store_id: ''
            });
        }
        setError(null);
        setLoading(false);
    }, [user, mode, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'add' ? 'Invitar Usuario' : 'Editar Usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {mode === 'add' && (
                        <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded text-sm">
                            📧 Se enviará un correo de invitación a este usuario para que establezca su contraseña.
                        </div>
                    )}

                    <InputField
                        label="Nombre Completo"
                        name="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ej: Juan Pérez"
                    />

                    <InputField
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="usuario@ejemplo.com"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Rol
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="cajera" className="bg-gray-800">Cajera</option>
                            <option value="gerente" className="bg-gray-800">Gerente</option>
                            <option value="admin" className="bg-gray-800">Administrador</option>
                            <option value="dev" className="bg-gray-800">Desarrollador</option>
                            <option value="staff" className="bg-gray-800">Staff</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="pending" className="bg-gray-800">Pendiente</option>
                            <option value="active" className="bg-gray-800">Activo</option>
                            <option value="inactive" className="bg-gray-800">Inactivo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sucursal
                        </label>
                        <select
                            value={formData.store_id || ''}
                            onChange={(e) => setFormData({ ...formData, store_id: e.target.value || undefined })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={storesLoading}
                        >
                            <option value="" className="bg-gray-800">Seleccionar sucursal</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id} className="bg-gray-800">
                                    {store.name} ({store.type === 'central' ? 'Central' : 'Sucursal'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? (mode === 'add' ? 'Enviando...' : 'Guardando...') : (mode === 'add' ? 'Enviar Invitación' : 'Guardar')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
