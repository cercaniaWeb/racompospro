'use client';
import React, { useState } from 'react';
import { db, Product } from '@/lib/db';
import { User, Lock, Coffee, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuthStore } from '@/store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  cost: number;
}

export default function EmployeeConsumptionModal({ isOpen, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener store context y empleados
  const { storeId } = useStoreContext();
  const { employees, isLoading: employeesLoading } = useEmployees(storeId || undefined);
  const { user } = useAuthStore();

  // Buscar productos en tiempo real
  const products = useLiveQuery(
    async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      return await db.products
        .where('name')
        .startsWithIgnoreCase(searchTerm)
        .or('sku')
        .startsWithIgnoreCase(searchTerm)
        .limit(5)
        .toArray();
    },
    [searchTerm]
  );

  const addProductToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex !== -1) {
      // Incrementar cantidad si ya existe
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      // Agregar nuevo producto
      setCart([...cart, {
        product,
        quantity: 1,
        cost: product.cost || product.price // Usar costo o precio
      }]);
    }

    setSearchTerm(''); // Limpiar búsqueda
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalCost = cart.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  const authorizeAndSave = async () => {
    if (pin !== '1234') { // Mock PIN - en producción validar contra base de datos
      alert('PIN de supervisor incorrecto');
      return;
    }

    if (!employeeId) {
      alert('Por favor seleccione un empleado');
      return;
    }

    if (cart.length === 0) {
      alert('No hay productos para registrar');
      return;
    }

    try {
      await db.consumptions.add({
        employee_id: employeeId,
        items: cart.map(item => ({
          product_id: item.product.id!,
          quantity: item.quantity,
          cost_at_moment: item.cost
        })),
        total_cost: totalCost,
        authorized_by: user?.id || 'unknown', // ID real del usuario autenticado
        status: 'pending_upload',
        created_at: new Date()
      });

      alert('Consumo registrado exitosamente');
      setCart([]);
      setPin('');
      setEmployeeId('');
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error("Error guardando consumo:", error);
      alert("Error guardando consumo");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Coffee className="text-orange-400" /> Consumo de Empleados
        </h3>

        <div className="space-y-4">
          {/* Selector de Empleado */}
          <div>
            <label className="text-gray-400 text-sm">Empleado</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <select
                className="w-full bg-gray-700 text-white p-2 pl-10 rounded-lg"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                disabled={employeesLoading}
              >
                <option value="">
                  {employeesLoading ? 'Cargando...' : 'Seleccione empleado...'}
                </option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Búsqueda de Productos */}
          <div>
            <label className="text-gray-400 text-sm">Buscar Producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-2 pl-10 rounded-lg"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Resultados de búsqueda */}
            {products && products.length > 0 && (
              <div className="mt-2 bg-gray-900 rounded-lg border border-gray-700 max-h-40 overflow-y-auto">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    className="w-full text-left p-2 hover:bg-gray-700 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-xs">SKU: {product.sku}</p>
                    </div>
                    <span className="text-green-400 font-mono">
                      ${(product.cost || product.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Carrito de Productos */}
          <div className="bg-gray-900 rounded-lg border border-gray-700">
            <div className="p-3 border-b border-gray-700">
              <h4 className="text-white font-semibold">Productos Seleccionados</h4>
            </div>

            {cart.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay productos seleccionados
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.product.name}</p>
                      <p className="text-gray-400 text-xs">
                        ${item.cost.toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Minus size={16} className="text-gray-400" />
                      </button>
                      <span className="text-white font-mono w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Plus size={16} className="text-gray-400" />
                      </button>

                      <span className="text-green-400 font-mono ml-2 w-20 text-right">
                        ${(item.cost * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(index)}
                        className="p-1 hover:bg-red-600 rounded ml-2"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800 flex justify-between items-center">
                <span className="text-gray-400 font-semibold">Total:</span>
                <span className="text-green-400 font-mono font-bold text-lg">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Autorización con PIN */}
          <div className="border-t border-gray-700 pt-4">
            <label className="text-gray-400 text-sm mb-1 block">
              Autorización (PIN del Supervisor)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="password"
                  className="w-full bg-gray-700 text-white p-2 pl-10 rounded-lg"
                  placeholder="****"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  maxLength={4}
                />
              </div>
              <button
                onClick={authorizeAndSave}
                className="bg-orange-600 hover:bg-orange-500 text-white px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0 || !employeeId}
              >
                Registrar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">PIN de prueba: 1234</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}