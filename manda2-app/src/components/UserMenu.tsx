'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { signout } from '@/app/auth/actions'
import { User as UserIcon, LogOut, Package, ChevronDown } from 'lucide-react'

export function UserMenu({
    user,
    onProfile,
    onSignOut
}: {
    user: User | null,
    onProfile: () => void,
    onSignOut: () => void
}) {
    const [isOpen, setIsOpen] = useState(false)

    if (!user) {
        return (
            <a
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
            >
                <UserIcon size={18} />
                <span>Entrar</span>
            </a>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-2 pr-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md transition-all"
            >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 text-sm font-bold border border-emerald-200">
                    {user.email?.[0].toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-gray-900 max-w-[100px] truncate leading-tight">
                        {user.user_metadata.full_name || user.email?.split('@')[0]}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/5"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Cuenta</p>
                            <p className="text-sm font-bold truncate text-emerald-950">{user.email}</p>
                        </div>

                        <div className="px-2 space-y-1">
                            <button
                                onClick={() => { setIsOpen(false); onProfile(); }}
                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors"
                            >
                                <div className="p-1.5 bg-emerald-100/50 text-emerald-700 rounded-lg">
                                    <Package size={16} />
                                </div>
                                Mis Pedidos
                            </button>


                            <div className="h-px bg-gray-50 my-1"></div>

                            <button
                                onClick={() => signout()}
                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                            >
                                <div className="p-1.5 bg-red-100/50 text-red-600 rounded-lg">
                                    <LogOut size={16} />
                                </div>
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
