import React, { useRef, useState } from 'react';
import { useModal } from '@/hooks/useModal';
import { TicketConfig } from '@/store/settingsStore';
import { X, Printer, Download, FileText } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { generateTicketHtml } from '@/utils/printTicket';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TicketPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
    items: any[];
    config: TicketConfig;
    user?: { name: string };
}

const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
    isOpen,
    onClose,
    sale,
    items,
    config,
    user
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    if (!isOpen || !sale) return null;

    const ticketHtml = generateTicketHtml({ sale, items, config, user });

    const handlePrint = async () => {
        // Create a hidden iframe to print
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir Ticket</title>
                    </head>
                    <body style="margin: 0; display: flex; justify-content: center;">
                        ${ticketHtml}
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }

        // Also save automatically
        await handleSave(false);
    };

    const handleSave = async (showSuccessAlert = true) => {
        if (!ticketRef.current) return;

        setIsGenerating(true);
        try {
            // We need to render the HTML to a canvas first
            // Since the preview might be scaled or styled differently, we create a temporary container
            const container = document.createElement('div');
            container.innerHTML = ticketHtml;
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '0';
            document.body.appendChild(container);

            // Wait for images to load
            const images = container.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
            }));

            const elementToCapture = container.firstElementChild as HTMLElement;

            const canvas = await html2canvas(elementToCapture, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, canvas.height * 80 / canvas.width] // Dynamic height based on 80mm width
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
            pdf.save(`Ticket_${sale.transaction_id}.pdf`);

            if (showSuccessAlert) {
                // Optional: Show a toast or small notification
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al guardar el ticket');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-gray-700 shadow-2xl flex overflow-hidden"
            >
                {/* LEFT: Preview Area */}
                <div className="flex-1 bg-gray-800/50 p-8 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                    <h3 className="text-gray-400 mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        Vista Previa (80mm)
                    </h3>

                    <div
                        className="bg-white shadow-lg overflow-hidden"
                        style={{ width: '80mm', minHeight: '100mm' }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: ticketHtml }} />
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Ticket</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="text-sm text-gray-400 mb-4">
                            <p>Seleccione una acción para el ticket de la venta:</p>
                            <p className="font-mono text-white mt-1">#{sale.transaction_id}</p>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handlePrint}
                            className="w-full py-4 text-lg flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700"
                            disabled={isGenerating}
                        >
                            <Printer size={24} />
                            Imprimir
                        </Button>
                        <p className="text-xs text-center text-gray-500 -mt-2">
                            Imprime y guarda copia PDF
                        </p>

                        <div className="h-px bg-gray-800 my-2" />

                        <Button
                            variant="secondary"
                            onClick={() => handleSave(true)}
                            className="w-full py-4 text-lg flex items-center justify-center gap-3"
                            disabled={isGenerating}
                        >
                            <Download size={24} />
                            {isGenerating ? 'Guardando...' : 'Guardar PDF'}
                        </Button>
                        <p className="text-xs text-center text-gray-500 -mt-2">
                            Descarga a tu dispositivo
                        </p>
                    </div>

                    <div className="p-6 bg-gray-800/30 border-t border-gray-700">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketPreviewModal;
