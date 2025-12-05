'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { useStoreContext } from '@/hooks/useStoreContext';
import RoleGuard from '@/components/auth/RoleGuard';
import { UserRole, ROLE_LABELS, ROLE_PERMISSIONS } from '@/types/roles';
import { Shield, Users, Store, CheckCircle, XCircle, Edit2 } from 'lucide-react';

export default function RolesDashboard() {
    const { user, isAdmin } = useAuth();
    const { storeId, storeName } = useStoreContext();
    const { employees, isLoading, refreshEmployees } = useEmployees(storeId || undefined);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-purple-600/20 text-purple-400 border-purple-500/50';
            case 'grte': return 'bg-blue-600/20 text-blue-400 border-blue-500/50';
            case 'cajero': return 'bg-green-600/20 text-green-400 border-green-500/50';
        }
    };

    const getPermissionsList = (role: UserRole) => {
        const permissions = ROLE_PERMISSIONS[role];
        if (permissions.includes('*')) {
            return ['Acceso Total a Todo el Sistema'];
        }
        return permissions;
    };

    return (
        <RoleGuard roles={['admin', 'grte']} redirectTo="/pos">
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/50">
                                    <Shield className="text-purple-400" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-white text-2xl font-bold">Gestión de Roles y Permisos</h1>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {isAdmin ? 'Vista completa del sistema' : `Tienda: ${storeName}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={refreshEmployees}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Usuarios */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Users className="text-blue-400" size={24} />
                                    <h2 className="text-white font-bold text-lg">
                                        Usuarios ({employees.length})
                                    </h2>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="p-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {employees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className="p-6 hover:bg-gray-700/30 transition-colors cursor-pointer"
                                            onClick={() => setSelectedUser(employee.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-white font-semibold">{employee.name}</h3>
                                                        <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                                                            {ROLE_LABELS[employee.role]}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mt-1">{employee.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {employee.status === 'active' ? (
                                                        <CheckCircle className="text-green-400" size={20} />
                                                    ) : (
                                                        <XCircle className="text-red-400" size={20} />
                                                    )}
                                                    {isAdmin && (
                                                        <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                                                            <Edit2 className="text-gray-400" size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel de Detalles / Permisos */}
                    <div className="lg:col-span-1">
                        {selectedUser ? (
                            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
                                {(() => {
                                    const employee = employees.find(e => e.id === selectedUser);
                                    if (!employee) return null;

                                    return (
                                        <>
                                            <div className="mb-6">
                                                <h3 className="text-white font-bold text-lg mb-2">Permisos</h3>
                                                <span className={`inline-block px-4 py-2 rounded-lg border text-sm font-medium ${getRoleBadgeColor(employee.role)}`}>
                                                    {ROLE_LABELS[employee.role]}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {getPermissionsList(employee.role).map((permission, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-2 text-sm text-gray-300 bg-gray-700/30 p-3 rounded-lg"
                                                    >
                                                        <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                                                        <span>{permission}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                                <Shield className="text-gray-600 mb-4" size={48} />
                                <p className="text-gray-400">
                                    Selecciona un usuario para ver sus permisos
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumen de Roles */}
                <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['admin', 'grte', 'cajero'] as UserRole[]).map((role) => {
                        const count = employees.filter(e => e.role === role).length;
                        return (
                            <div key={role} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-4 py-2 rounded-lg border text-sm font-medium ${getRoleBadgeColor(role)}`}>
                                        {ROLE_LABELS[role]}
                                    </span>
                                    <span className="text-white text-2xl font-bold">{count}</span>
                                </div>
                                <div className="text-gray-400 text-xs space-y-1">
                                    {getPermissionsList(role).slice(0, 3).map((perm, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                            <span className="truncate">{perm}</span>
                                        </div>
                                    ))}
                                    {getPermissionsList(role).length > 3 && (
                                        <div className="text-gray-500 text-xs">
                                            +{getPermissionsList(role).length - 3} más...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </RoleGuard>
    );
}
