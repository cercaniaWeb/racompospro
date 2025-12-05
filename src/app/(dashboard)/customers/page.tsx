'use client';

import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { db, Customer } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/useModal';

const CustomersPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { logout, user: authUser } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    });

    // Queries
    const customers = useLiveQuery(
        async () => {
            let collection = db.customers.orderBy('name');
            if (searchTerm) {
                return collection.filter(c =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (c.email ? c.email.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
                    (c.tax_id ? c.tax_id.includes(searchTerm) : false)
                ).toArray();
            }
            return collection.toArray();
        },
        [searchTerm]
    );

    // User data
    const user = {
        name: authUser?.name || 'Admin',
        status: 'online' as const,
    };

    const { modalRef, handleBackdropClick } = useModal({
        onClose: () => setShowModal(false),
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    const handleOpenModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                tax_id: customer.tax_id || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                tax_id: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const customerData: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                tax_id: formData.tax_id,
                is_active: true,
                last_modified: new Date(),
                sync_status: 'pending'
            };

            if (editingCustomer && editingCustomer.id) {
                await db.customers.update(editingCustomer.id, customerData);
            } else {
                customerData.created_at = new Date();
                await db.customers.add(customerData);
            }

            setShowModal(false);
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Error al guardar cliente');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este cliente?')) {
            try {
                await db.customers.update(id, { is_active: false, sync_status: 'pending' });
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    };

    return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
                        <p className="text-muted-foreground">Administra la base de datos de clientes</p>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <div className="flex items-center gap-2">
                            <UserPlus size={20} />
                            Nuevo Cliente
                        </div>
                    </Button>
                </div>

                <div className="glass rounded-xl border border-white/10 shadow mb-6 p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-md leading-5 bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground/70 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Buscar por nombre, email o RFC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass rounded-xl border border-white/10 shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC / Tax ID</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {customers?.filter(c => c.is_active).map(customer => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-foreground">{customer.name}</div>
                                        <div className="text-sm text-muted-foreground">{customer.address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{customer.email}</div>
                                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {customer.tax_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(customer)}
                                            className="text-primary hover:text-primary/80 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id!)}
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!customers || customers.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showModal && (
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={handleBackdropClick}
                    >
                        <div ref={modalRef} className="glass rounded-2xl p-6 w-full max-w-2xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4 text-foreground">
                                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <InputField
                                        id="name"
                                        label="Nombre Completo"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <InputField
                                        id="tax_id"
                                        label="RFC / Tax ID"
                                        value={formData.tax_id}
                                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    />
                                    <InputField
                                        id="email"
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <InputField
                                        id="phone"
                                        label="Teléfono"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <div className="md:col-span-2">
                                        <InputField
                                            id="address"
                                            label="Dirección"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        Guardar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
};

export default CustomersPage;
