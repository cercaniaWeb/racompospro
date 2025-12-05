import React from 'react';
import ProductCard from '@/components/molecules/ProductCard';
import SearchBar from '@/components/molecules/SearchBar';
import DataTable from '@/components/molecules/DataTable';
import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: string;
  barcode?: string;
  sku?: string;
  onPriceEdit?: () => void;
}

interface ProductListProps {
  products: Product[];
  onSearch: (query: string) => void;
  onAddToCart?: (product: Product) => void;
  viewMode?: 'grid' | 'table';
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onSearch,
  onAddToCart,
  viewMode = 'grid'
}) => {
  const router = useRouter();

  if (viewMode === 'table') {
    // ... (table view logic)
  }

  // Grid view
  return (
    <div className="space-y-4">
      <SearchBar onSearch={onSearch} placeholder="Buscar productos..." />
      {products.length === 0 ? (
        // ... (empty state)
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No se encontraron productos</h3>
          <p className="text-muted-foreground">Intente con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              stock={product.stock}
              category={product.category}
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