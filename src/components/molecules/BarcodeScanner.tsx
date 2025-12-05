import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
    onClose,
}) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner
        const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            // Use native BarcodeDetector if supported (much faster)
            useBarCodeDetectorIfSupported: true,
            videoConstraints: {
                facingMode: "environment",
                focusMode: "continuous",
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
            },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.QR_CODE,
            ],
        };

        // Use a unique ID for the scanner element
        const scannerId = "reader";

        try {
            if (!scannerRef.current) {
                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    config,
          /* verbose= */ false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        // Stop scanning after success to prevent multiple rapid scans
                        scanner.clear().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(err => {
                            console.error("Failed to clear scanner", err);
                            onScanSuccess(decodedText); // Still trigger success
                        });
                    },
                    (errorMessage) => {
                        if (onScanFailure) {
                            onScanFailure(errorMessage);
                        }
                    }
                );
            }
        } catch (err: any) {
            console.error("Error initializing scanner:", err);
            setError("Error al iniciar la cámara. Asegúrate de dar permisos.");
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white">Escanear Código</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
                    {error ? (
                        <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    ) : (
                        <div id="reader" className="w-full overflow-hidden rounded-lg bg-black"></div>
                    )}
                    <p className="text-center text-gray-400 text-sm mt-4">
                        Apunta la cámara al código de barras del producto
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
