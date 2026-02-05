import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-gray-400 animate-pulse">Cargando...</p>
        </div>
    );
}
