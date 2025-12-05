import { useEffect, useRef, useCallback } from 'react';

interface UseModalOptions {
    onClose: () => void;
    closeOnEscape?: boolean;
    closeOnClickOutside?: boolean;
}

/**
 * Hook para manejar el cierre de modales con ESC y click fuera
 */
export function useModal({
    onClose,
    closeOnEscape = true,
    closeOnClickOutside = true
}: UseModalOptions) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Manejar ESC
    useEffect(() => {
        if (!closeOnEscape) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose, closeOnEscape]);

    // Manejar click fuera
    const handleBackdropClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!closeOnClickOutside) return;

            // Solo cerrar si el click fue en el backdrop, no en el contenido del modal
            if (event.target === event.currentTarget) {
                onClose();
            }
        },
        [onClose, closeOnClickOutside]
    );

    return {
        modalRef,
        handleBackdropClick
    };
}
