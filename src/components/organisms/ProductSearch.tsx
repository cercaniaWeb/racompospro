import React, { useState } from 'react';
import SearchBar from '@/components/molecules/SearchBar';
import DataTable from '@/components/molecules/DataTable';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode: string;
  sku: string;
}

interface ProductSearchProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
  showAddButton?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  products, 
  onProductSelect,
  showAddButton = true 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.barcode.includes(query) ||
        product.sku.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const tableColumns = [
    { key: 'name', title: 'Nombre' },
    { 
      key: 'price', 
      title: 'Precio',
      render: (value: number) => new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(value)
    },
    { key: 'stock', title: 'Stock' },
    { key: 'category', title: 'Categoría' },
    { key: 'barcode', title: 'Código de barras' },
    { key: 'sku', title: 'SKU' },
    ...(onProductSelect && showAddButton ? [{
      key: 'actions', 
      title: 'Acciones',
      render: (value: any, product: Product) => (
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => onProductSelect(product)}
        >
          Seleccionar
        </Button>
      )
    }] : [])
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Text variant="h4" className="font-semibold">
          Búsqueda de Productos
        </Text>
        <div className="text-sm text-gray-500">
          {filteredProducts.length} producto(s) encontrado(s)
        </div>
      </div>
      
      <SearchBar 
        onSearch={handleSearch} 
        placeholder="Buscar por nombre, código de barras o SKU..." 
      />
      
      <DataTable 
        data={filteredProducts} 
        columns={tableColumns as any} 
        showPagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default ProductSearch;