'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { useModal } from '@/hooks/useModal';
import RoleGuard from '@/components/auth/RoleGuard';
import { Tag, Plus, Edit, Trash2, Search, ChevronRight, Folder } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Category } from '@/lib/supabase/types';

const CategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });

    const { modalRef, handleBackdropClick } = useModal({
        onClose: () => {
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', parent_id: '' });
        },
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            const categoryData = {
                name: formData.name,
                description: formData.description,
                parent_id: formData.parent_id || null
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({
                        ...categoryData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingCategory.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([categoryData]);

                if (error) throw error;
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', parent_id: '' });
            fetchCategories();
        } catch (err: any) {
            console.error('Error saving category:', err);
            alert(`Error al guardar: ${err.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría? Si tiene subcategorías, estas quedarán huérfanas.')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCategories();
        } catch (err: any) {
            console.error('Error deleting category:', err);
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id || ''
        });
        setShowModal(true);
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Organize into tree structure for display (only if not searching)
    const getCategoryTree = () => {
        if (searchQuery) return filteredCategories;

        const parents = categories.filter(c => !c.parent_id);
        const tree: any[] = [];

        parents.forEach(parent => {
            tree.push({ ...parent, level: 0 });
            const children = categories.filter(c => c.parent_id === parent.id);
            children.forEach(child => {
                tree.push({ ...child, level: 1 });
            });
        });

        // Add orphans (if any logic error or data issue)
        const processedIds = new Set(tree.map(c => c.id));
        const orphans = categories.filter(c => !processedIds.has(c.id));
        orphans.forEach(orphan => tree.push({ ...orphan, level: 0 }));

        return tree;
    };

    const displayCategories = getCategoryTree();

    return (
        <RoleGuard roles={['admin', 'grte']} redirectTo="/dashboard">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Tag className="text-blue-400" />
                            Gestión de Categorías
                        </h1>
                        <p className="text-gray-400 text-sm">Administra las categorías y subcategorías de productos</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} className="mr-2" />
                        Nueva Categoría
                    </Button>
                </div>

                {/* Search */}
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar categorías..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr className="text-left text-gray-300 text-sm">
                                <th className="p-4 font-medium">Nombre</th>
                                <th className="p-4 font-medium">Descripción</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">Cargando...</td>
                                </tr>
                            ) : displayCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">No se encontraron categorías</td>
                                </tr>
                            ) : (
                                displayCategories.map((category: any) => (
                                    <tr key={category.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-medium">
                                            <div className="flex items-center" style={{ paddingLeft: `${(category.level || 0) * 24}px` }}>
                                                {category.level > 0 && <ChevronRight size={16} className="text-gray-500 mr-1" />}
                                                {category.level === 0 && <Folder size={16} className="text-blue-400 mr-2" />}
                                                {category.name}
                                                {category.level > 0 && <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">Subcategoría</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">{category.description || '-'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
                        <div ref={modalRef} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <InputField
                                    label="Nombre *"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Bebidas"
                                    required
                                />
                                <InputField
                                    label="Descripción"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción opcional"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Categoría Padre (Opcional)
                                    </label>
                                    <select
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    >
                                        <option value="">Ninguna (Categoría Principal)</option>
                                        {categories
                                            .filter(c => c.id !== editingCategory?.id && !c.parent_id) // Prevent self-parenting and only show top-level as parents for now (1 level depth)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Selecciona una categoría padre para convertirla en subcategoría.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowModal(false)}
                                    >
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
        </RoleGuard>
    );
};

export default CategoriesPage;
