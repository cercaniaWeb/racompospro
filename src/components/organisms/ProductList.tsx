import React from 'react';
import ProductCard from '@/components/molecules/ProductCard';
import SearchBar from '@/components/molecules/SearchBar';
import DataTable from '@/components/molecules/DataTable';
import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Skeleton from '@/components/atoms/Skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  stockTotal?: number;
  category?: string;
  barcode?: string;
  sku?: string;
  measurement_unit?: string;
  onPriceEdit?: () => void;
}

interface ProductListProps {
  products: Product[];
  onSearch: (query: string) => void;
  onAddToCart?: (product: Product) => void;
  viewMode?: 'grid' | 'table';
  loading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onSearch,
  onAddToCart,
  viewMode = 'grid',
  loading = false
}) => {
  const router = useRouter();

  if (viewMode === 'table') {
    // Para el modo tabla, podrías querer agregar la columna de stock total también
    // Pero por ahora mantengamos la consistencia con el grid
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 h-[380px] space-y-4">
            <Skeleton variant="rectangular" height={192} className="w-full" />
            <div className="space-y-2">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
            <div className="mt-auto">
              <Skeleton variant="rectangular" height={40} className="w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-4">
      <SearchBar onSearch={onSearch} placeholder="Buscar productos..." />
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white/5 rounded-full p-6 mb-4 backdrop-blur-sm border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No se encontraron productos</h3>
          <p className="text-white/40">Intente con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              stock={product.stock}
              stockTotal={product.stockTotal}
              category={product.category}
              measurement_unit={product.measurement_unit}
              onAddToCart={() => onAddToCart && onAddToCart(product)}
              onEdit={product.onPriceEdit}
              onClick={() => router.push(`/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;