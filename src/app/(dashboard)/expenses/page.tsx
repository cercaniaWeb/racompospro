'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { db, ShoppingList, Expense } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useModal } from '@/hooks/useModal';

const ExpensesPage = () => {
    const [activeTab, setActiveTab] = useState<'shopping' | 'expenses'>('shopping');
    const [showAddListModal, setShowAddListModal] = useState(false);
    const [newListName, setNewListName] = useState('');

    // Queries
    const shoppingLists = useLiveQuery(() => db.shoppingLists.toArray());
    const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray());

    const { modalRef, handleBackdropClick } = useModal({
        onClose: () => setShowAddListModal(false),
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    // Mock user
    const user = {
        name: 'Admin',
        status: 'online' as const,
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        try {
            await db.shoppingLists.add({
                name: newListName,
                items: [],
                status: 'active',
                created_at: new Date(),
                sync_status: 'pending'
            });
            setNewListName('');
            setShowAddListModal(false);
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const handleAddItem = async (listId: number, itemName: string) => {
        const list = await db.shoppingLists.get(listId);
        if (list) {
            const updatedItems = [...list.items, {
                name: itemName,
                quantity: 1,
                is_purchased: false
            }];
            await db.shoppingLists.update(listId, { items: updatedItems });
        }
    };

    const handleToggleItem = async (listId: number, itemIndex: number) => {
        const list = await db.shoppingLists.get(listId);
        if (list) {
            const updatedItems = [...list.items];
            updatedItems[itemIndex].is_purchased = !updatedItems[itemIndex].is_purchased;
            await db.shoppingLists.update(listId, { items: updatedItems });
        }
    };

    const handleConvertToList = async (list: ShoppingList) => {
        if (confirm('¿Desea convertir esta lista en un gasto registrado?')) {
            try {
                // Calculate estimated total (mock logic for now as we don't have prices in items yet)
                // In a real app, we'd ask for the total amount
                const amount = parseFloat(prompt('Ingrese el monto total del gasto:') || '0');

                if (amount > 0) {
                    await db.expenses.add({
                        description: `Compra de lista: ${list.name}`,
                        amount: amount,
                        category: 'inventory',
                        date: new Date(),
                        payment_method: 'cash',
                        shopping_list_id: list.id,
                        created_at: new Date(),
                        sync_status: 'pending'
                    });

                    await db.shoppingLists.update(list.id!, { status: 'completed' });
                    alert('Gasto registrado correctamente');
                }
            } catch (error) {
                console.error('Error converting to expense:', error);
            }
        }
    };

    return (
    <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Control de Gastos y Compras</h1>
                    <div className="space-x-2">
                        <Button
                            variant={activeTab === 'shopping' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('shopping')}
                        >
                            Listas de Compras
                        </Button>
                        <Button
                            variant={activeTab === 'expenses' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('expenses')}
                        >
                            Historial de Gastos
                        </Button>
                    </div>
                </div>

                {activeTab === 'shopping' && (
                    <div>
                        <div className="mb-4">
                            <Button onClick={() => setShowAddListModal(true)}>
                                + Nueva Lista
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shoppingLists?.filter(l => l.status === 'active').map(list => (
                                <div key={list.id} className="glass rounded-xl border border-white/10 shadow p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg">{list.name}</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {format(list.created_at, 'dd MMM yyyy', { locale: es })}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {list.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.is_purchased}
                                                        onChange={() => handleToggleItem(list.id!, idx)}
                                                        className="mr-2"
                                                    />
                                                    <span className={item.is_purchased ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-2 flex">
                                            <input
                                                type="text"
                                                placeholder="Agregar ítem..."
                                                className="flex-1 border border-white/10 bg-white/5 rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddItem(list.id!, e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <Button
                                            variant="secondary"
                                            className="w-full text-sm"
                                            onClick={() => handleConvertToList(list)}
                                        >
                                            Registrar como Gasto
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="glass rounded-xl border border-white/10 shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {expenses?.map(expense => (
                                    <tr key={expense.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {format(expense.date, 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-bold">
                                            ${expense.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add List Modal */}
                {showAddListModal && (
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={handleBackdropClick}
                    >
                        <div ref={modalRef} className="glass rounded-2xl p-6 w-full max-w-md border border-white/10">
                            <h2 className="text-xl font-bold mb-4 text-foreground">Nueva Lista de Compras</h2>
                            <InputField
                                id="listName"
                                label="Nombre de la Lista"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="Ej: Compras Semanales"
                            />
                            <div className="flex justify-end space-x-2 mt-4">
                                <Button variant="secondary" onClick={() => setShowAddListModal(false)}>Cancelar</Button>
                                <Button variant="primary" onClick={handleCreateList}>Crear</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
};

export default ExpensesPage;
