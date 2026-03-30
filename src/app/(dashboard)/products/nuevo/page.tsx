'use client';

import React, { useState, useEffect } from 'react';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';
import { useProduct } from '@/hooks/useProduct';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { supabase } from '@/lib/supabase/client';
import { Check, Tag } from 'lucide-react';
import { Category } from '@/lib/supabase/types';

const NewProductPage = () => {
  const { addProduct, error } = useProduct();
  const { user } = useAuth();
  const { storeId: contextStoreId, storeName } = useStoreContext();
  
  const [successMsg, setSuccessMsg] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [isBatchTracked, setIsBatchTracked] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isWeighted, setIsWeighted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Resolve store_id: prefer user metadata, then storeContext, then localStorage
  const resolvedStoreId = user?.store_id || contextStoreId || (typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    try {
      if (!resolvedStoreId) {
        alert('No se encontró la sucursal destino. Por favor recarga la página.');
        return;
      }

      await addProduct({
        name,
        description,
        price: parseFloat(price),
        selling_price: parseFloat(price),
        cost: parseFloat(cost),
        sku,
        barcode,
        category,
        category_id: categoryId || undefined,
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        is_active: true,
        is_weighted: isWeighted,
        measurement_unit: isWeighted ? 'kg' : 'unit',
        image_url: imageUrl,
        is_batch_tracked: isBatchTracked,
        batch_number: isBatchTracked ? batchNumber : undefined,
        expiry_date: isBatchTracked ? expiryDate : undefined,
      } as any, resolvedStoreId);

      setName('');
      setDescription('');
      setPrice('');
      setCost('');
      setSku('');
      setBarcode('');
      setCategory('');
      setCategoryId('');
      setStock('');
      setMinStock('');
      setIsWeighted(false);
      setIsBatchTracked(false);
      setBatchNumber('');
      setExpiryDate('');
      setImage(null);
      setImageUrl('');

      setSuccessMsg(`Producto "${name}" creado exitosamente.`);
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nuevo Producto</h1>
        <p className="text-gray-400">
          Añadir un nuevo producto al inventario
          {storeName && <span className="ml-2 text-blue-400 font-medium bg-blue-400/10 px-2 py-1 rounded-full text-xs">→ {storeName}</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Check className="w-5 h-5" />
            </div>
            <p className="font-medium">{successMsg}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información General */}
          <div className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-4">Información General</h2>
            
            <InputField
              id="name"
              label="Nombre del Producto"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nombre del producto"
              className="bg-white/5 border-white/10"
            />

            <InputField
              id="description"
              label="Descripción"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del producto"
              className="bg-white/5 border-white/10"
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                id="price"
                label="Precio de Venta"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="0.00"
                step="0.01"
                className="bg-white/5 border-white/10"
              />

              <InputField
                id="cost"
                label="Costo"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                placeholder="0.00"
                step="0.01"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                id="sku"
                label="SKU"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Código SKU único"
                className="bg-white/5 border-white/10"
              />

              <InputField
                id="barcode"
                label="Código de Barras"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Código EAN/UPC"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Inventario y Categoría */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-6">
              <h2 className="text-xl font-semibold text-white/90 border-b border-white/10 pb-4">Inventario</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Categoría
                </label>
                <div className="relative group">
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer group-hover:border-white/20"
                    value={categoryId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCategoryId(id);
                      const cat = categories.find(c => c.id === id);
                      if (cat) setCategory(cat.name);
                    }}
                  >
                    <option value="" className="bg-gray-900">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-gray-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-400 transition-colors" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="stock"
                  label="Stock Inicial"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="0"
                  className="bg-white/5 border-white/10"
                />

                <InputField
                  id="minStock"
                  label="Stock Mínimo"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isWeighted}
                    onChange={(e) => setIsWeighted(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Venta por Peso (granel)</span>
                    <span className="text-xs text-gray-400">El producto se vende por Kg en lugar de unidades</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isBatchTracked}
                    onChange={(e) => setIsBatchTracked(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Lotes y Caducidad</span>
                    <span className="text-xs text-gray-400">Seguimiento de fechas de vencimiento</span>
                  </div>
                </label>

                {isBatchTracked && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <InputField
                      label="Nº de Lote"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="LOTE-001"
                      className="bg-transparent"
                    />
                    <InputField
                      label="Caducidad"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="bg-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Imagen Section */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2">
                Imagen
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Opcional</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-2xl border-2 border-white/10 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center gap-1">
                      <Tag size={24} className="opacity-20" />
                      <span className="text-[10px] font-medium uppercase tracking-tight">Sin Imagen</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <div className="flex gap-2">
                    <label className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all text-sm font-medium text-center cursor-pointer text-white">
                      Subir archivo
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImage(file);
                            setImageUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!name) return alert('Ingresa un nombre primero');
                        try {
                          const { data, error } = await supabase.functions.invoke('search-product-image', {
                            body: { query: `${name} ${barcode || ''}` },
                          });
                          if (error) throw error;
                          if (data?.imageUrl) {
                            setImageUrl(data.imageUrl);
                            setImage(null);
                          } else {
                            alert('No se encontró imagen');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Error al buscar imagen');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/20 hover:bg-blue-500/30 transition-all text-sm font-medium text-blue-400 flex items-center gap-2"
                    >
                      ✨ IA Search
                    </button>
                  </div>
                  <InputField
                    label="URL de imagen"
                    placeholder="O pega una URL directa"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImage(null);
                    }}
                    className="text-xs py-2 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-8 border-t border-white/10">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
            className="px-8 bg-transparent hover:bg-white/5 border-white/10"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            className="px-8 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl"
          >
            {successMsg ? 'Crear Otro Producto' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProductPage;