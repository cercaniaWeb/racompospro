'use client';

import React, { useState } from 'react';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';
import { Plus, Store, Scale, Camera, Receipt, Bell, Calendar, CheckCircle, Trash2, Banknote, Lock } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { useModal } from '@/hooks/useModal';
import { supabase } from '@/lib/supabase/client';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('company');
  const [stores, setStores] = useState([
    { id: 'bodega_central', name: 'Bodega Central', address: 'Calle Principal #123', type: 'bodega' },
    { id: 'tienda_2', name: 'Tienda 2 (Sur)', address: 'Av. Sur #456', type: 'sucursal' }
  ]);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', address: '', type: 'sucursal' });

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState({ title: '', message: '', due_date: '' });
  const [loadingReminders, setLoadingReminders] = useState(false);

  const { logout, user: authUser } = useAuthStore();
  const router = useRouter();
  const {
    scaleSimulationEnabled,
    toggleScaleSimulation,
    barcodeMode,
    setBarcodeMode,
    ticketConfig,
    updateTicketConfig
  } = useSettingsStore();

  const { modalRef, handleBackdropClick } = useModal({
    onClose: () => setShowAddStoreModal(false),
    closeOnEscape: true,
    closeOnClickOutside: true
  });

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  // User data
  const user = {
    name: authUser?.name || 'Admin',
    status: 'online' as const,
    role: 'admin' // Simulated role
  };

  // Fetch stores on mount
  React.useEffect(() => {
    const fetchStores = async () => {
      const { data } = await supabase.from('stores').select('*').eq('is_active', true);
      if (data) setStores(data);
    };

    fetchStores();
  }, []);

  // Fetch reminders
  const fetchReminders = async () => {
    setLoadingReminders(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });

    if (data) setReminders(data);
    setLoadingReminders(false);
  };

  React.useEffect(() => {
    if (activeSection === 'reminders') {
      fetchReminders();
    }
  }, [activeSection]);

  const handleAddStore = async () => {
    if (!newStore.name) return;

    try {
      const { data, error } = await supabase.from('stores').insert({
        name: newStore.name,
        address: newStore.address,
        type: newStore.type,
        is_active: true
      }).select().single();

      if (error) throw error;

      setStores([...stores, data]);
      setNewStore({ name: '', address: '', type: 'sucursal' });
      setShowAddStoreModal(false);
      alert('Tienda registrada correctamente');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Error al registrar la tienda');
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.due_date) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get store_id from user_stores or metadata (fallback)
      // For now, we'll use the first store in the list or a default if available
      const storeId = stores[0]?.id || '2860cccf-1b3a-471a-9b9f-ed5a5716f659';

      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        store_id: storeId,
        title: newReminder.title,
        message: newReminder.message,
        due_date: new Date(newReminder.due_date).toISOString(),
        is_completed: false
      });

      if (error) throw error;

      setNewReminder({ title: '', message: '', due_date: '' });
      fetchReminders();
      alert('Recordatorio creado');
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Error al crear recordatorio');
    }
  };

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('¿Eliminar recordatorio?')) return;
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Gestiona las configuraciones del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass rounded-xl border border-white/10 shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Navegación</h2>
            <ul className="space-y-2">
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'company' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('company')}>
                Empresa
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'stores' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('stores')}>
                Sucursales
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'hardware' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('hardware')}>
                Hardware (Básculas/Escáneres)
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'taxes' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('taxes')}>
                Impuestos
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'ticket' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('ticket')}>
                Editor de Ticket
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'reminders' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('reminders')}>
                Recordatorios
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'bank' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('bank')}>
                Datos Bancarios
              </li>
              <li className={`border-b border-white/10 pb-2 cursor-pointer ${activeSection === 'security' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSection('security')}>
                Seguridad
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass rounded-xl border border-white/10 shadow p-6">
            {activeSection === 'company' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-foreground">Información de la Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="companyName" label="Nombre de la Empresa" type="text" defaultValue="Tienda de Abarrotes Racom-POS" required />
                    <InputField id="companyRfc" label="RFC" type="text" defaultValue="TDA123456789" required />
                    <InputField id="companyAddress" label="Dirección" type="text" defaultValue="Calle Principal #123" required />
                    <InputField id="companyPhone" label="Teléfono" type="tel" defaultValue="(555) 123-4567" required />
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="primary">Guardar Cambios</Button>
                </div>
              </div>
            )}

            {activeSection === 'stores' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-foreground">Sucursales</h3>
                  {user.role === 'admin' && (
                    <Button size="sm" onClick={() => setShowAddStoreModal(true)}>
                      <Plus size={16} className="mr-1" /> Nueva Tienda
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {stores.map(store => (
                    <div key={store.id} className="border border-white/10 rounded-lg p-4 flex justify-between items-center bg-white/5">
                      <div className="flex items-center">
                        <div className="bg-primary/20 p-2 rounded-full mr-3">
                          <Store size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="text-sm text-muted-foreground">{store.address}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize border border-primary/20">
                        {store.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'hardware' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-foreground">Configuración de Hardware</h3>

                  <div className="border border-white/10 rounded-lg p-4 mb-4 bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Scale className="mr-2 text-primary" size={20} />
                        <span className="font-medium text-foreground">Báscula</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-sm mr-2 ${scaleSimulationEnabled ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {scaleSimulationEnabled ? 'Simulación Activa' : 'Modo Real'}
                        </span>
                        <button
                          onClick={toggleScaleSimulation}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${scaleSimulationEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${scaleSimulationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Activa el modo simulación para probar sin hardware físico conectado.
                    </p>
                  </div>
                  {scaleSimulationEnabled && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">⚡ Simulación activa - Pesos: 2.0-3.0 kg con variaciones</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary-600" />
                    Escáner de Códigos de Barras
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="barcodeMode"
                        checked={barcodeMode === 'scanner'}
                        onChange={() => setBarcodeMode('scanner')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium">Escáner USB/Serial</div>
                        <div className="text-sm text-gray-600">Escáner físico (recomendado)</div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="barcodeMode"
                        checked={barcodeMode === 'camera'}
                        onChange={() => setBarcodeMode('camera')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium">Cámara del Dispositivo</div>
                        <div className="text-sm text-gray-600">Webcam o cámara móvil</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'taxes' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Configuración de Impuestos</h3>
                <p className="text-sm text-gray-600 mb-4">NOTA: De acuerdo con la documentación, el sistema no aplica impuestos a las ventas.</p>
                <div className="flex items-center">
                  <input type="checkbox" id="applyTaxes" className="h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked={false} disabled />
                  <label htmlFor="applyTaxes" className="ml-2 block text-sm text-gray-900">Aplicar impuestos a las ventas</label>
                </div>
              </div>
            )}

            {activeSection === 'ticket' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Editor */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Receipt className="text-primary" size={20} />
                    Configuración del Ticket
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logo del Ticket</label>
                    <div className="flex gap-2 mb-2">
                      <InputField
                        id="logoUrl"
                        label=""
                        type="text"
                        value={ticketConfig.logoUrl || ''}
                        onChange={(e) => updateTicketConfig({ logoUrl: e.target.value })}
                        placeholder="URL de la imagen o ruta local"
                        className="flex-1"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              updateTicketConfig({ logoUrl: url });
                            }
                          }}
                        />
                        <Button variant="secondary" className="h-full">
                          Examinar
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Recomendado: Imagen PNG con fondo transparente</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Encabezado del Ticket</label>
                    <textarea
                      value={ticketConfig.headerText}
                      onChange={(e) => updateTicketConfig({ headerText: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white h-24 focus:border-primary outline-none"
                      placeholder="Nombre de la tienda, dirección, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pie de Página</label>
                    <textarea
                      value={ticketConfig.footerText}
                      onChange={(e) => updateTicketConfig({ footerText: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white h-24 focus:border-primary outline-none"
                      placeholder="Mensaje de agradecimiento, políticas, etc."
                    />
                  </div>

                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Opciones de Visualización</h4>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketConfig.showLogo}
                        onChange={(e) => updateTicketConfig({ showLogo: e.target.checked })}
                        className="h-4 w-4 text-primary rounded border-gray-600 bg-gray-700 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-300">Mostrar Logo (Nombre de Tienda Grande)</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketConfig.showDate}
                        onChange={(e) => updateTicketConfig({ showDate: e.target.checked })}
                        className="h-4 w-4 text-primary rounded border-gray-600 bg-gray-700 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-300">Mostrar Fecha y Hora</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketConfig.showCashier}
                        onChange={(e) => updateTicketConfig({ showCashier: e.target.checked })}
                        className="h-4 w-4 text-primary rounded border-gray-600 bg-gray-700 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-300">Mostrar Nombre del Cajero</span>
                    </label>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-300">Vista Previa</h3>
                  <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-[300px] mx-auto font-mono text-xs leading-tight">
                    {ticketConfig.showLogo && (
                      <div className="text-center mb-4 border-b-2 border-black pb-2">
                        {ticketConfig.logoUrl ? (
                          <img src={ticketConfig.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                        ) : (
                          <h1 className="text-xl font-bold">Racom-POS</h1>
                        )}
                      </div>
                    )}

                    <div className="text-center whitespace-pre-wrap mb-4">
                      {ticketConfig.headerText}
                    </div>

                    <div className="mb-4 space-y-1">
                      {ticketConfig.showDate && (
                        <div className="flex justify-between">
                          <span>Fecha:</span>
                          <span>23/11/2025 14:30</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Ticket:</span>
                        <span>#000123</span>
                      </div>
                      {ticketConfig.showCashier && (
                        <div className="flex justify-between">
                          <span>Cajero:</span>
                          <span>Juan Pérez</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-b border-dashed border-black py-2 mb-4 space-y-2">
                      <div className="flex justify-between">
                        <span>1 x Coca Cola 600ml</span>
                        <span>$18.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2 x Sabritas Sal 45g</span>
                        <span>$30.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 x Galletas Maria</span>
                        <span>$15.00</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-sm mb-4">
                      <span>TOTAL</span>
                      <span>$63.00</span>
                    </div>

                    <div className="text-center whitespace-pre-wrap text-[10px]">
                      {ticketConfig.footerText}
                    </div>

                    <div className="mt-4 text-center">
                      <p>*** COPIA CLIENTE ***</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reminders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Bell className="text-primary" size={20} />
                    Recordatorios
                  </h3>
                </div>

                {/* Add Reminder Form */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Nuevo Recordatorio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Título"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                      placeholder="Ej. Pagar luz"
                    />
                    <InputField
                      label="Fecha y Hora"
                      type="datetime-local"
                      value={newReminder.due_date}
                      onChange={(e) => setNewReminder({ ...newReminder, due_date: e.target.value })}
                    />
                  </div>
                  <InputField
                    label="Mensaje (Opcional)"
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    placeholder="Detalles adicionales..."
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={handleAddReminder} disabled={!newReminder.title || !newReminder.due_date}>
                      <Plus size={16} className="mr-2" />
                      Agregar Recordatorio
                    </Button>
                  </div>
                </div>

                {/* Reminders List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Próximos Eventos</h4>
                  {loadingReminders ? (
                    <p className="text-muted-foreground text-sm">Cargando...</p>
                  ) : reminders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-white/5 rounded-lg border border-white/10 border-dashed">
                      <Bell size={24} className="mx-auto mb-2 opacity-50" />
                      <p>No hay recordatorios pendientes</p>
                    </div>
                  ) : (
                    reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-4 rounded-lg border flex items-start justify-between group transition-all ${reminder.is_completed
                          ? 'bg-white/5 border-white/5 opacity-60'
                          : 'bg-white/5 border-white/10 hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleReminder(reminder.id, reminder.is_completed)}
                            className={`mt-1 rounded-full p-1 transition-colors ${reminder.is_completed ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-primary'
                              }`}
                          >
                            <CheckCircle size={20} />
                          </button>
                          <div>
                            <h5 className={`font-medium ${reminder.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {reminder.title}
                            </h5>
                            {reminder.message && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-primary/80">
                              <Calendar size={12} />
                              {new Date(reminder.due_date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSection === 'bank' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-foreground flex items-center gap-2">
                    <Banknote className="text-primary" size={20} />
                    Configuración de Transferencias
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estos datos se mostrarán al cliente cuando seleccione &quot;Transferencia&quot; como método de pago.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nombre del Banco"
                      value={useSettingsStore.getState().bankConfig.bankName}
                      onChange={(e) => useSettingsStore.getState().updateBankConfig({ bankName: e.target.value })}
                      placeholder="Ej. BBVA"
                    />
                    <InputField
                      label="Beneficiario"
                      value={useSettingsStore.getState().bankConfig.beneficiary}
                      onChange={(e) => useSettingsStore.getState().updateBankConfig({ beneficiary: e.target.value })}
                      placeholder="Nombre del titular"
                    />
                    <InputField
                      label="Número de Cuenta"
                      value={useSettingsStore.getState().bankConfig.accountNumber}
                      onChange={(e) => useSettingsStore.getState().updateBankConfig({ accountNumber: e.target.value })}
                      placeholder="10 dígitos"
                    />
                    <InputField
                      label="CLABE Interbancaria"
                      value={useSettingsStore.getState().bankConfig.clabe}
                      onChange={(e) => useSettingsStore.getState().updateBankConfig({ clabe: e.target.value })}
                      placeholder="18 dígitos"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-foreground flex items-center gap-2">
                    <Lock className="text-primary" size={20} />
                    Seguridad
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura el PIN de supervisor para autorizar consumos de empleados y otras acciones sensibles.
                  </p>

                  <div className="max-w-md">
                    <InputField
                      label="PIN de Supervisor"
                      type="text"
                      maxLength={4}
                      value={useSettingsStore.getState().supervisorPin}
                      onChange={(e) => useSettingsStore.getState().setSupervisorPin(e.target.value)}
                      placeholder="4 dígitos"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Este PIN se solicitará al registrar consumos de empleados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Store Modal */}
      {showAddStoreModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="glass rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-foreground">Registrar Nueva Tienda</h2>
            <div className="space-y-4">
              <InputField
                id="storeName"
                label="Nombre de la Tienda"
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              />
              <InputField
                id="storeAddress"
                label="Dirección"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newStore.type}
                  onChange={(e) => setNewStore({ ...newStore, type: e.target.value })}
                >
                  <option value="sucursal">Sucursal</option>
                  <option value="bodega">Bodega</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="secondary" onClick={() => setShowAddStoreModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleAddStore}>Registrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;