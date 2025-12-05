'use client';
import React, { useState } from 'react';
import { db } from '@/lib/db';
import { User, Lock, Coffee } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeConsumptionModal({ isOpen, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [cart, setCart] = useState<any[]>([]); // Simplificado para el ejemplo

  // Lógica de autorización simulada (esto debería validar contra una tabla de usuarios locales)
  const authorizeAndSave = async () => {
    if (pin !== '1234') { // Ejemplo
      alert('PIN de supervisor incorrecto');
      return;
    }

    const totalCost = cart.reduce((acc, item) => acc + (item.cost * item.qty), 0);

    await db.consumptions.add({
      employee_id: employeeId,
      items: cart.map(i => ({ 
        product_id: i.id, 
        quantity: i.qty, 
        cost_at_moment: i.cost 
      })),
      total_cost: totalCost,
      authorized_by: 'supervisor_actual_id',
      status: 'pending_upload',
      created_at: new Date()
    });

    alert('Consumo registrado correctamente');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Coffee className="text-orange-400" /> Registro de Consumo Personal
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Empleado</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <select 
                className="w-full bg-gray-700 text-white p-2 pl-10 rounded-lg"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
              >
                <option value="">Seleccionar empleado...</option>
                <option value="emp_1">Juan Pérez</option>
                <option value="emp_2">María López</option>
              </select>
            </div>
          </div>

          {/* Aquí iría un mini-buscador de productos similar al del POS */}
          <div className="bg-gray-900 p-4 rounded-lg h-32 flex items-center justify-center text-gray-500 border border-gray-700 border-dashed">
            [Mini Buscador de Productos Aquí]
          </div>

          <div className="border-t border-gray-700 pt-4">
            <label className="text-gray-400 text-sm mb-1 block">Autorización (PIN Gerente)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="password" 
                  className="w-full bg-gray-700 text-white p-2 pl-10 rounded-lg"
                  placeholder="****"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                />
              </div>
              <button 
                onClick={authorizeAndSave}
                className="bg-orange-600 hover:bg-orange-500 text-white px-6 rounded-lg font-bold"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
