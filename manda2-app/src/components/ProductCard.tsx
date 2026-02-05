'use client';
import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Product } from '@/lib/types';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);
        onAdd(product);
    };

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    };

    const isOutOfStock = product.stock <= 0;

    return (
        <div className="group relative bg-white border border-white/40 rounded-[2.5rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {/* Image Container */}
            <div className="relative aspect-square rounded-[1.75rem] bg-slate-50 overflow-hidden mb-4 shadow-inner">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl select-none opacity-20 bg-emerald-50">
                        <Package size={40} className="text-emerald-600" />
                    </div>
                )}

                {/* Heart / Favorite */}
                <button
                    onClick={handleFavorite}
                    className={`absolute top-3 left-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 z-10
                        ${isFavorite
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-red-500 border border-white/50 shadow-sm'}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                    >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                </button>

                {isOutOfStock && (

                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                        <span className="bg-white/95 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">
                            Agotado
                        </span>
                    </div>
                )}

                {/* Floating Action Button */}
                <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`absolute bottom-3 right-3 w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl transition-all 
                    ${isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                            : 'bg-white/90 backdrop-blur-md text-emerald-800 hover:bg-emerald-900 hover:text-white active:scale-90 border border-white/50'}
                    ${isPressed ? 'scale-90 bg-emerald-900 text-white' : ''}
                `}
                >
                    <Plus size={22} strokeWidth={3} />
                </button>
            </div>


            {/* Info */}
            <div className="px-1">
                <div className="min-h-[2.5em] mb-1">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                        {product.name}
                    </h3>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-lg text-emerald-700">
                            ${product.price}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            /{product.is_weighted ? 'kg' : 'pz'}
                        </span>
                    </div>

                    {/* Low Stock Warning */}
                    {!isOutOfStock && product.stock <= 5 && (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">
                            ¡ÚLTIMOS {product.stock}!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

