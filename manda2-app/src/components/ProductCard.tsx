'use client';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);
        onAdd(product);
    };

    const isOutOfStock = product.stock <= 0;

    return (
        <div className="group relative bg-white border border-gray-100 rounded-3xl p-3 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            {/* Image Container */}
            <div className="relative aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-3">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl select-none opacity-30 bg-gray-100">
                        ✨
                    </div>
                )}

                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <span className="bg-white/90 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                            Agotado
                        </span>
                    </div>
                )}

                {/* Floating Action Button */}
                <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all 
                    ${isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed hidden'
                            : 'bg-white/90 backdrop-blur-md text-emerald-700 hover:bg-emerald-600 hover:text-white active:scale-90'}
                    ${isPressed ? 'scale-90 bg-emerald-600 text-white' : ''}
                `}
                >
                    <Plus size={20} strokeWidth={3} />
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
                </div>
            </div>
        </div>
    );
};
