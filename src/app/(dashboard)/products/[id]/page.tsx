'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/supabase/types';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { ArrowLeft, Save, X } from 'lucide-react';

interface ProductBatch {
  id: string;
  batch_number: string;
  expiry_date: string;
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [batchData, setBatchData] = useState<{
    isBatchTracked: boolean;
    batchNumber: string;
    expiryDate: string;
    batchId?: string;
  }>({
    isBatchTracked: false,
    batchNumber: '',
    expiryDate: '',
  });

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      setProduct(productData);
      setFormData(productData);

      // Fetch latest batch
      const { data: batches, error: batchError } = await supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!batchError && batches && batches.length > 0) {
        setBatchData({
          isBatchTracked: true,
          batchNumber: batches[0].batch_number,
          expiryDate: batches[0].expiry_date,
          batchId: batches[0].id
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // 1. Update product details
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          cost: formData.cost,
          sku: formData.sku,
          barcode: formData.barcode,
          category: formData.category,
          min_stock: formData.min_stock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Handle batch data
      if (batchData.isBatchTracked && batchData.batchNumber && batchData.expiryDate) {
        if (batchData.batchId) {
          // Update existing batch
          const { error: batchUpdateError } = await supabase
            .from('product_batches')
            .update({
              batch_number: batchData.batchNumber,
              expiry_date: batchData.expiryDate
            })
            .eq('id', batchData.batchId);

          if (batchUpdateError) throw batchUpdateError;
        } else {
          // Create new batch
          const { error: batchCreateError } = await supabase
            .from('product_batches')
            .insert([{
              product_id: id,
              batch_number: batchData.batchNumber,
              expiry_date: batchData.expiryDate,
              created_at: new Date().toISOString()
            }]);

          if (batchCreateError) throw batchCreateError;
        }
      }

      setIsEditing(false);
      fetchProductData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !product) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!product) return <div className="p-6">Producto no encontrado</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Detalle del Producto'}
            </h1>
            <p className="text-gray-500 text-sm">ID: {product.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Guardar
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Editar Producto
            </Button>
          )}
        </div>
      </div>

      <div className="glass rounded-xl border border-white/10 shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Información General</h2>

            <InputField
              label="Nombre"
              value={isEditing ? formData.name || '' : product.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
            />

            <InputField
              label="Descripción"
              value={isEditing ? formData.description || '' : product.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Precio"
                type="number"
                value={isEditing ? formData.price || 0 : product.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
              <InputField
                label="Costo"
                type="number"
                value={isEditing ? formData.cost || 0 : product.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="SKU"
                value={isEditing ? formData.sku || '' : product.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                disabled={!isEditing}
              />
              <InputField
                label="Código de Barras"
                value={isEditing ? formData.barcode || '' : product.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <InputField
              label="Categoría"
              value={isEditing ? formData.category || '' : product.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={!isEditing}
            />

            {/* Image Section */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-medium text-foreground mb-3">Imagen del Producto</h3>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative group">
                  {(isEditing ? formData.image_url : product.image_url) ? (
                    <img
                      src={isEditing ? formData.image_url : product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs text-center p-2">Sin imagen</span>
                  )}
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!formData.name) return alert('Ingresa un nombre primero');
                        try {
                          setLoading(true);
                          const { data, error } = await supabase.functions.invoke('search-product-image', {
                            body: { query: `${formData.name} ${formData.barcode || ''}` }
                          });

                          if (error) throw error;
                          if (data?.imageUrl) {
                            setFormData({ ...formData, image_url: data.imageUrl });
                          } else {
                            alert('No se encontró ninguna imagen');
                          }
                        } catch (err: any) {
                          console.error('Full Error:', err);
                          if (err.context && err.context.json) {
                            err.context.json().then((body: any) => {
                              console.error('Error Body:', body);
                              alert(`Error: ${body.error || 'Desconocido'} \n ${JSON.stringify(body.googleResponse || {}, null, 2)}`);
                            });
                          } else {
                            alert('Error al buscar imagen. Revisa la consola para más detalles.');
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      ✨ Auto-generar Imagen
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Busca automáticamente una imagen basada en el nombre.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Inventory & Batch */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Inventario</h2>
              <InputField
                label="Stock Mínimo"
                type="number"
                value={isEditing ? formData.min_stock || 0 : product.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Control de Lotes y Caducidad</h2>

              {isEditing ? (
                <div className="space-y-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchData.isBatchTracked}
                      onChange={(e) => setBatchData({ ...batchData, isBatchTracked: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Habilitar control por lotes</span>
                  </label>

                  {batchData.isBatchTracked && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <InputField
                        label="Número de Lote"
                        value={batchData.batchNumber}
                        onChange={(e) => setBatchData({ ...batchData, batchNumber: e.target.value })}
                        placeholder="Ej. LOTE-001"
                      />
                      <InputField
                        label="Fecha de Caducidad"
                        type="date"
                        value={batchData.expiryDate}
                        onChange={(e) => setBatchData({ ...batchData, expiryDate: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  {batchData.isBatchTracked ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase">Lote Actual</label>
                        <p className="font-medium text-foreground">{batchData.batchNumber}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase">Caducidad</label>
                        <p className={`font-medium ${new Date(batchData.expiryDate) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                          {batchData.expiryDate}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Este producto no tiene control de lotes activo.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;