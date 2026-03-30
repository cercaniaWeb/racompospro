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

export interface BankConfig {
    bankName: string;
    accountNumber: string;
    clabe: string;
    beneficiary: string;
}

interface SettingsState {
    // Scale settings
    scaleSimulationEnabled: boolean;
    scaleBaudRate: number;

    // Barcode scanner settings
    barcodeMode: 'scanner' | 'camera';

    // Ticket settings
    ticketConfig: TicketConfig;

    // Bank settings
    bankConfig: BankConfig;

    // Security
    supervisorPin: string;

    // Actions
    toggleScaleSimulation: () => void;
    setScaleBaudRate: (rate: number) => void;
    setBarcodeMode: (mode: 'scanner' | 'camera') => void;
    updateTicketConfig: (config: Partial<TicketConfig>) => void;
    updateBankConfig: (config: Partial<BankConfig>) => void;
    setSupervisorPin: (pin: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Default values
            scaleSimulationEnabled: false,
            scaleBaudRate: 9600,
            barcodeMode: 'scanner',
            supervisorPin: '1234', // Default PIN
            ticketConfig: {
                headerText: 'Tienda de Abarrotes abarrotesracompos\nCalle Principal #123\nTel: (555) 123-4567',
                footerText: '¡Gracias por su compra!\nVuelva pronto',
                showLogo: true,
                showDate: true,
                showCashier: true,
                logoUrl: '/images/logo.png'
            },
            bankConfig: {
                bankName: 'BBVA Bancomer',
                accountNumber: '1234567890',
                clabe: '012345678901234567',
                beneficiary: 'Tienda Racom S.A. de C.V.'
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

            updateBankConfig: (config) =>
                set((state) => ({ bankConfig: { ...state.bankConfig, ...config } })),

            setSupervisorPin: (pin) =>
                set({ supervisorPin: pin }),
        }),
        {
            name: 'pos-settings-storage',
        }
    )
);
