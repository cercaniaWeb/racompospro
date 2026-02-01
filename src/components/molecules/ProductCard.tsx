import React from 'react';
import Image from '@/components/atoms/Image';
import Text from '@/components/atoms/Text';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { Edit } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: string;
  onAddToCart?: () => void;
  onEdit?: () => void;
  onClick?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  stock,
  category,
  onAddToCart,
  onEdit,
  onClick,
  className = ''
}) => {
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);

  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group relative cursor-pointer ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {image ? (
        <div className="relative overflow-hidden h-48">
          <Image
            src={image}
            alt={name}
            width={300}
            height={200}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60" />

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute top-2 right-2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors z-20"
              title="Editar precio"
              aria-label={`Editar precio de ${name}`}
            >
              <Edit size={20} />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/5 w-full h-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/20 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute top-2 right-2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors z-20"
              title="Editar precio"
              aria-label={`Editar precio de ${name}`}
            >
              <Edit size={20} />
            </button>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-3">
          <Text variant="h6" className="font-bold text-white tracking-tight leading-tight">{name}</Text>
          {category && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/5">
              {category}
            </span>
          )}
        </div>

        <Text variant="body" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-4">
          {formattedPrice}
        </Text>

        {stock !== undefined && (
          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-xs uppercase tracking-wider font-medium text-white/50">
              <span>Stock Available</span>
              <span>{stock}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stock > 10 ? 'bg-green-500' : stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (stock / 20) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {onAddToCart && (
          <Button
            className="mt-auto w-full group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] min-h-[48px]"
            onClick={onAddToCart}
            variant="primary"
            aria-label={`Añadir ${name} al carrito`}
          >
            Añadir al carrito
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;