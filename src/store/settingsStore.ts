import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TicketConfig {
    headerText: string;
    footerText: string;
    showLogo: boolean;
    showDate: boolean;
    showCashier: boolean;
    logoUrl?: string;
}

interface SettingsState {
    // Scale settings
    scaleSimulationEnabled: boolean;
    scaleBaudRate: number;

    // Barcode scanner settings
    barcodeMode: 'scanner' | 'camera';

    // Ticket settings
    ticketConfig: TicketConfig;

    // Actions
    toggleScaleSimulation: () => void;
    setScaleBaudRate: (rate: number) => void;
    setBarcodeMode: (mode: 'scanner' | 'camera') => void;
    updateTicketConfig: (config: Partial<TicketConfig>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Default values
            scaleSimulationEnabled: false,
            scaleBaudRate: 9600,
            barcodeMode: 'scanner',
            ticketConfig: {
                headerText: 'Tienda de Abarrotes Racom-POS\nCalle Principal #123\nTel: (555) 123-4567',
                footerText: '¡Gracias por su compra!\nVuelva pronto',
                showLogo: true,
                showDate: true,
                showCashier: true,
                logoUrl: '/images/logo.png'
            },

            // Actions
            toggleScaleSimulation: () =>
                set((state) => ({ scaleSimulationEnabled: !state.scaleSimulationEnabled })),

            setScaleBaudRate: (rate) =>
                set({ scaleBaudRate: rate }),

            setBarcodeMode: (mode) =>
                set({ barcodeMode: mode }),

            updateTicketConfig: (config) =>
                set((state) => ({ ticketConfig: { ...state.ticketConfig, ...config } })),
        }),
        {
            name: 'pos-settings-storage',
        }
    )
);
