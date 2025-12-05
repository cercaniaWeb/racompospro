'use client';

import React, { useState } from 'react';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';
import { useProduct } from '@/hooks/useProduct';
import { supabase } from '@/lib/supabase/client';

const NewProductPage = () => {
  const { addProduct, error } = useProduct();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [isBatchTracked, setIsBatchTracked] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isWeighted, setIsWeighted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Mock user data

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addProduct({
        name,
        description,
        price: parseFloat(price),
        selling_price: parseFloat(price),
        cost: parseFloat(cost),
        sku,
        barcode,
        category,
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        is_active: true,
        is_weighted: isWeighted,
        measurement_unit: isWeighted ? 'kg' : 'unit',
        // @ts-ignore
        image_url: imageUrl,
        // @ts-ignore
        is_batch_tracked: isBatchTracked,
        // @ts-ignore
        batch_number: isBatchTracked ? batchNumber : undefined,
        // @ts-ignore
        expiry_date: isBatchTracked ? expiryDate : undefined,
      });

      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setCost('');
      setSku('');
      setBarcode('');
      setCategory('');
      setStock('');
      setMinStock('');
      setIsWeighted(false);
      setIsBatchTracked(false);
      setBatchNumber('');
      setExpiryDate('');
      setImage(null);

      console.log('Product created successfully');
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-600">Añadir un nuevo producto al inventario</p>
      </div>

      <div className="glass rounded-xl border border-white/10 shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputField
                id="name"
                label="Nombre del Producto"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nombre del producto"
              />

              <InputField
                id="description"
                label="Descripción"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto"
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
                />
              </div>

              <InputField
                id="sku"
                label="SKU"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                placeholder="Código SKU único"
              />
            </div>

            <div>
              <InputField
                id="barcode"
                label="Código de Barras"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                placeholder="Código de barras UPC/EAN"
              />

              <InputField
                id="category"
                label="Categoría"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="Categoría del producto"
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="stock"
                  label="Stock Inicial"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="0"
                />

                <InputField
                  id="minStock"
                  label="Stock Mínimo"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  required
                  placeholder="0"
                />
              </div>

              <div className="mt-4 space-y-4">
                <label className="flex items-center space-x-3 p-4 border border-white/10 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={isWeighted}
                    onChange={(e) => setIsWeighted(e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-primary border-white/20 bg-black/20 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Venta a Granel / Por Peso</span>
                    <span className="text-xs text-muted-foreground">Habilitar para usar con la báscula (Kg)</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-white/10 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={isBatchTracked}
                    onChange={(e) => setIsBatchTracked(e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-primary border-white/20 bg-black/20 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Controlar por Lotes / Caducidad</span>
                    <span className="text-xs text-muted-foreground">Habilitar para productos perecederos</span>
                  </div>
                </label>

                {isBatchTracked && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <InputField
                      label="Número de Lote Inicial"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Ej. LOTE-001"
                    />
                    <InputField
                      label="Fecha de Caducidad"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Imagen del Producto
                </label>

                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative group">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs text-center p-2">Sin imagen</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-md hover:border-primary/50 transition-colors">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-muted-foreground justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                            <span>Seleccionar archivo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setImage(file);
                                  // Create a fake local URL for preview
                                  setImageUrl(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF hasta 10MB
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!name) return alert('Ingresa un nombre primero');
                        try {
                          // Import supabase client dynamically or ensure it's imported at top
                          const { supabase } = await import('@/lib/supabase/client');

                          console.log('Invoking search-product-image with query:', `${name} ${barcode || ''}`);
                          console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

                          const { data, error } = await supabase.functions.invoke('search-product-image', {
                            body: { query: `${name} ${barcode || ''}` },
                            headers: {
                              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                            }
                          });

                          if (error) throw error;
                          if (data?.imageUrl) {
                            setImageUrl(data.imageUrl);
                            setImage(null); // Clear file if we use URL
                          } else {
                            alert('No se encontró ninguna imagen');
                          }
                        } catch (err: any) {
                          console.error('Full Error:', err);
                          // Try to parse response body from error if available
                          if (err.context && err.context.json) {
                            err.context.json().then((body: any) => {
                              console.error('Error Body:', body);
                              alert(`Error: ${body.error || 'Desconocido'} \n ${JSON.stringify(body.googleResponse || {}, null, 2)}`);
                            });
                          } else {
                            alert('Error al buscar imagen. Revisa la consola para más detalles.');
                          }
                        }
                      }}
                    >
                      ✨ Auto-generar Imagen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear Producto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProductPage;